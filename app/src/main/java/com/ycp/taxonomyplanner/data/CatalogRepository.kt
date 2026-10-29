package com.ycp.taxonomyplanner.data

import com.ycp.taxonomyplanner.data.local.AttributeEntity
import com.ycp.taxonomyplanner.data.local.AttributeValueEntity
import com.ycp.taxonomyplanner.data.local.CatalogDao
import com.ycp.taxonomyplanner.data.local.MeasurementDimensionEntity
import com.ycp.taxonomyplanner.data.local.MeasurementUnitEntity
import com.ycp.taxonomyplanner.data.local.ProductTypeAttributeEntity
import com.ycp.taxonomyplanner.data.local.SeedCatalogData
import com.ycp.taxonomyplanner.data.local.TaxonomyNodeEntity
import com.ycp.taxonomyplanner.data.local.UnitConversionRuleEntity
import com.ycp.taxonomyplanner.data.local.ValueSetEntity
import com.ycp.taxonomyplanner.data.remote.SupabaseSyncService
import com.ycp.taxonomyplanner.domain.DataType
import com.ycp.taxonomyplanner.domain.DomainRules
import com.ycp.taxonomyplanner.domain.EnrichedAttributeExport
import com.ycp.taxonomyplanner.domain.EnrichedBreadcrumb
import com.ycp.taxonomyplanner.domain.EnrichedCategoryExport
import com.ycp.taxonomyplanner.domain.FilterType
import com.ycp.taxonomyplanner.domain.NodeType
import com.ycp.taxonomyplanner.domain.RecordStatus
import com.ycp.taxonomyplanner.domain.encodeEnrichedCatalog
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class CatalogRepository(
    private val dao: CatalogDao,
    val syncService: SupabaseSyncService = SupabaseSyncService()
) {
    val nodesFlow: Flow<List<TaxonomyNodeEntity>> = dao.observeNodes()
    val attributesFlow: Flow<List<AttributeEntity>> = dao.observeAttributes()
    val bindingsFlow: Flow<List<ProductTypeAttributeEntity>> = dao.observeBindings()
    val valueSetsFlow: Flow<List<ValueSetEntity>> = dao.observeValueSets()
    val attributeValuesFlow: Flow<List<AttributeValueEntity>> = dao.observeAttributeValues()
    val dimensionsFlow: Flow<List<MeasurementDimensionEntity>> = dao.observeDimensions()
    val unitsFlow: Flow<List<MeasurementUnitEntity>> = dao.observeUnits()
    val conversionRulesFlow: Flow<List<UnitConversionRuleEntity>> = dao.observeConversionRules()

    suspend fun ensureSeeded() {
        val currentNodes = dao.getAllNodes()
        if (currentNodes.isEmpty()) {
            dao.upsertDimensions(SeedCatalogData.initialDimensions())
            dao.upsertUnits(SeedCatalogData.initialUnits())
            dao.upsertConversionRules(SeedCatalogData.initialConversionRules())
            dao.upsertAttributes(SeedCatalogData.initialAttributes())
            dao.upsertValueSets(SeedCatalogData.initialValueSets())
            dao.upsertAttributeValues(SeedCatalogData.initialAttributeValues())
            dao.upsertNodes(SeedCatalogData.initialNodes())
            dao.upsertBindings(SeedCatalogData.initialBindings())
        }
    }

    fun getAncestors(nodeId: String, allNodes: List<TaxonomyNodeEntity>): List<TaxonomyNodeEntity> {
        val map = allNodes.associateBy { it.id }
        val result = mutableListOf<TaxonomyNodeEntity>()
        val visited = mutableSetOf<String>()
        var current = map[nodeId]?.parentId?.let { map[it] }
        while (current != null && visited.add(current.id)) {
            result.add(0, current)
            current = current.parentId?.let { map[it] }
        }
        return result
    }

    fun getDescendants(nodeId: String, allNodes: List<TaxonomyNodeEntity>): Set<String> {
        val childrenByParent = allNodes.groupBy { it.parentId }
        val result = mutableSetOf<String>()
        val queue = ArrayDeque<String>()
        queue.add(nodeId)
        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            for (child in childrenByParent[current].orEmpty()) {
                if (result.add(child.id)) {
                    queue.add(child.id)
                }
            }
        }
        return result
    }

    fun getFullPathAr(nodeId: String, allNodes: List<TaxonomyNodeEntity>): String {
        val map = allNodes.associateBy { it.id }
        val target = map[nodeId] ?: return ""
        val ancestors = getAncestors(nodeId, allNodes)
        return (ancestors + target).joinToString(" / ") { it.nameAr }
    }

    fun getDisqualifiedParentIds(
        nodeId: String,
        targetNodeType: NodeType,
        allNodes: List<TaxonomyNodeEntity>
    ): Set<String> {
        val descendants = getDescendants(nodeId, allNodes)
        val allowedParentTypes = DomainRules.allowedParentTypesForNode(targetNodeType)
        return allNodes.filter { candidate ->
            candidate.id == nodeId ||
                candidate.id in descendants ||
                candidate.parsedStatus == RecordStatus.ARCHIVED ||
                candidate.parsedNodeType !in allowedParentTypes
        }.map { it.id }.toSet()
    }

    suspend fun saveTaxonomyNode(
        id: String?,
        nameAr: String,
        nameEn: String?,
        description: String,
        slugInput: String,
        nodeType: NodeType,
        parentId: String?,
        imagePath: String?,
        sortOrder: Int,
        status: RecordStatus
    ): Result<TaxonomyNodeEntity> {
        val trimmedAr = nameAr.trim()
        if (trimmedAr.isEmpty()) {
            return Result.failure(IllegalArgumentException("الاسم بالعربية مطلوب."))
        }
        val normalizedSlug = DomainRules.normalizeSlug(slugInput.ifBlank { trimmedAr })
        val allNodes = dao.getAllNodes()
        val existing = id?.let { targetId -> allNodes.find { it.id == targetId } }

        // Check active slug uniqueness
        if (status == RecordStatus.ACTIVE) {
            val conflict = allNodes.find {
                it.id != existing?.id &&
                    it.parsedStatus == RecordStatus.ACTIVE &&
                    it.slug.equals(normalizedSlug, ignoreCase = true)
            }
            if (conflict != null) {
                return Result.failure(
                    IllegalArgumentException("الرابط (Slug) '$normalizedSlug' مستخدم بالفعل في التصنيف النشط '${conflict.nameAr}'.")
                )
            }
        }

        // Prevent cycles
        if (existing != null && parentId != null) {
            if (parentId == existing.id || parentId in getDescendants(existing.id, allNodes)) {
                return Result.failure(
                    IllegalArgumentException("لا يمكن نقل التصنيف إلى نفسه أو إلى أحد أحفاده (منع الحلقات التكرارية).")
                )
            }
        }

        val parentNode = parentId?.let { pid -> allNodes.find { it.id == pid } }
        if (parentId != null && parentNode == null) {
            return Result.failure(IllegalArgumentException("التصنيف الأب المحدد غير موجود."))
        }
        if (parentNode?.parsedStatus == RecordStatus.ARCHIVED) {
            return Result.failure(IllegalArgumentException("لا يمكن وضع تصنيف تحت عقدة مؤرشفة."))
        }

        val placementChanged = existing == null ||
            existing.parentId != parentId ||
            existing.parsedNodeType != nodeType

        if (placementChanged) {
            val placementError = DomainRules.validatePlacement(nodeType, parentNode?.parsedNodeType)
            if (placementError != null) {
                return Result.failure(IllegalArgumentException(placementError))
            }
        }

        // If archiving, verify no active children
        if (status == RecordStatus.ARCHIVED && existing != null) {
            val activeChildren = allNodes.count {
                it.parentId == existing.id && it.parsedStatus == RecordStatus.ACTIVE
            }
            if (activeChildren > 0) {
                return Result.failure(
                    IllegalArgumentException("لا يمكن أرشفة هذا التصنيف لأنه يحتوي على $activeChildren تصنيفات فرعية نشطة.")
                )
            }
        }

        val saved = TaxonomyNodeEntity(
            id = existing?.id ?: "cat_${UUID.randomUUID().toString().take(12)}",
            legacyId = existing?.legacyId,
            nodeType = nodeType.key,
            nameAr = trimmedAr,
            nameEn = nameEn?.trim()?.takeIf { it.isNotEmpty() },
            description = description.trim().take(2000),
            slug = normalizedSlug,
            parentId = parentId,
            imagePath = imagePath ?: existing?.imagePath,
            sortOrder = sortOrder,
            status = status.key,
            updatedAt = System.currentTimeMillis()
        )
        dao.upsertNode(saved)
        return Result.success(saved)
    }

    suspend fun archiveOrDeleteNode(nodeId: String): Result<String> {
        val allNodes = dao.getAllNodes()
        val target = allNodes.find { it.id == nodeId }
            ?: return Result.failure(IllegalArgumentException("العقدة غير موجودة."))
        val activeChildren = allNodes.filter {
            it.parentId == nodeId && it.parsedStatus == RecordStatus.ACTIVE
        }
        if (activeChildren.isNotEmpty()) {
            return Result.failure(
                IllegalArgumentException("لا يمكن أرشفة أو حذف '${target.nameAr}' لوجود ${activeChildren.size} عقد فرعية نشطة مرتبطة به.")
            )
        }
        val bindings = dao.getAllBindings().filter { it.productTypeNodeId == nodeId }
        return if (bindings.isNotEmpty() || target.legacyId != null) {
            dao.upsertNode(target.copy(status = RecordStatus.ARCHIVED.key, updatedAt = System.currentTimeMillis()))
            Result.success("تمت أرشفة '${target.nameAr}' بأمان مع الحفاظ على السجلات المرجعية.")
        } else {
            dao.deleteNodeById(nodeId)
            Result.success("تم حذف التصنيف '${target.nameAr}'.")
        }
    }

    suspend fun saveProductTypeBinding(
        id: String?,
        productTypeNodeId: String,
        attributeId: String,
        roleKey: String,
        groupName: String,
        isRequired: Boolean,
        isFilterable: Boolean,
        isVariant: Boolean,
        minValue: Double?,
        maxValue: Double?,
        unitId: String?,
        valueSetId: String?,
        allowedValues: List<String>,
        sortOrder: Int
    ): Result<ProductTypeAttributeEntity> {
        val node = dao.getAllNodes().find { it.id == productTypeNodeId }
            ?: return Result.failure(IllegalArgumentException("عقدة نوع المنتج غير موجودة."))
        if (node.parsedNodeType != NodeType.PRODUCT_TYPE) {
            return Result.failure(
                IllegalArgumentException("Product Type هو الحد الوحيد لربط الخصائص؛ لا يمكن ربط الخصائص بتصنيف عادي.")
            )
        }
        val attr = dao.getAllAttributes().find { it.id == attributeId }
            ?: return Result.failure(IllegalArgumentException("الخاصية المحددة غير موجودة."))

        if (minValue != null && maxValue != null && minValue > maxValue) {
            return Result.failure(
                IllegalArgumentException("الحد الأعلى يجب أن يكون أكبر من أو يساوي الحد الأدنى.")
            )
        }

        if (unitId != null) {
            val unit = dao.getAllUnits().find { it.id == unitId }
                ?: return Result.failure(IllegalArgumentException("الوحدة المحددة غير موجودة."))
            if (unit.parsedStatus != RecordStatus.ACTIVE) {
                return Result.failure(IllegalArgumentException("يجب اختيار وحدة قياس نشطة."))
            }
            if (attr.measurementDimensionId != null && unit.dimensionId != attr.measurementDimensionId) {
                return Result.failure(IllegalArgumentException("الوحدة المختارة لا تتطابق مع البُعد الفيزيائي للخاصية."))
            }
        }

        if (valueSetId != null) {
            if (attr.parsedDataType != DataType.ENUM) {
                return Result.failure(IllegalArgumentException("مجموعات القيم مخصصة للخصائص من نوع قائمة محددة (Enum) فقط."))
            }
            val valueSet = dao.getAllValueSets().find { it.id == valueSetId }
                ?: return Result.failure(IllegalArgumentException("مجموعة القيم غير موجودة."))
            if (valueSet.attributeId != null && valueSet.attributeId != attr.id) {
                return Result.failure(IllegalArgumentException("مجموعة القيم المختارة مخصصة لخاصية أخرى."))
            }
        }

        val existingBindings = dao.getAllBindings().filter { it.productTypeNodeId == productTypeNodeId }
        val duplicate = existingBindings.find { it.attributeId == attributeId && it.id != id }
        if (duplicate != null) {
            return Result.failure(IllegalArgumentException("الخاصية '${attr.nameAr}' مرتبطة بالفعل بنوع المنتج هذا."))
        }

        val entity = ProductTypeAttributeEntity(
            id = id ?: "bind_${UUID.randomUUID().toString().take(10)}",
            productTypeNodeId = productTypeNodeId,
            attributeId = attributeId,
            role = if (isVariant) "variant" else roleKey,
            groupName = groupName.trim().ifEmpty { "المواصفات الأساسية" },
            isRequired = isRequired,
            isFilterable = isFilterable,
            isVariant = isVariant,
            minValue = if (attr.parsedDataType == DataType.NUMBER) minValue else null,
            maxValue = if (attr.parsedDataType == DataType.NUMBER) maxValue else null,
            unitId = if (attr.parsedDataType == DataType.NUMBER) unitId else null,
            valueSetId = if (attr.parsedDataType == DataType.ENUM) valueSetId else null,
            allowedValuesCsv = allowedValues.map { it.trim() }.filter { it.isNotEmpty() }.joinToString("|"),
            sortOrder = sortOrder
        )
        dao.upsertBinding(entity)
        return Result.success(entity)
    }

    suspend fun removeProductTypeBinding(bindingId: String) {
        dao.deleteBindingById(bindingId)
    }

    suspend fun saveAttributeDefinition(
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        dataType: DataType,
        filterType: FilterType,
        measurementDimensionId: String?,
        aliases: List<String>,
        status: RecordStatus
    ): Result<AttributeEntity> {
        val trimmedAr = nameAr.trim()
        if (trimmedAr.isEmpty()) {
            return Result.failure(IllegalArgumentException("اسم الخاصية بالعربية مطلوب."))
        }
        val key = DomainRules.normalizeKey(keyInput.ifBlank { nameEn ?: trimmedAr })
        if (!DomainRules.isCompatibleFilter(dataType, filterType)) {
            return Result.failure(
                IllegalArgumentException("نمط الفلترة '${filterType.labelAr}' غير متوافق مع نوع البيانات '${dataType.labelAr}'.")
            )
        }
        val dimensionId = if (dataType == DataType.NUMBER) measurementDimensionId else null
        val allAttrs = dao.getAllAttributes()
        val conflict = allAttrs.find { it.id != id && it.key.equals(key, ignoreCase = true) }
        if (conflict != null) {
            return Result.failure(IllegalArgumentException("المفتاح البرمجي '$key' مستخدم بالفعل للخاصية '${conflict.nameAr}'."))
        }

        if (status == RecordStatus.ARCHIVED && id != null) {
            val activeUsages = dao.getAllBindings().count { it.attributeId == id }
            if (activeUsages > 0) {
                return Result.failure(
                    IllegalArgumentException("لا يمكن أرشفة الخاصية لأنها مرتبطة حالياً بـ $activeUsages من أنواع المنتجات.")
                )
            }
        }

        val existing = id?.let { allAttrs.find { a -> a.id == it } }
        val saved = AttributeEntity(
            id = existing?.id ?: "attr_${UUID.randomUUID().toString().take(10)}",
            key = key,
            nameAr = trimmedAr,
            nameEn = nameEn?.trim()?.takeIf { it.isNotEmpty() },
            dataType = dataType.key,
            filterType = filterType.key,
            measurementDimensionId = dimensionId,
            legacyUnit = existing?.legacyUnit,
            aliasesCsv = aliases.map { it.trim() }.filter { it.isNotEmpty() }.distinct().joinToString("|"),
            status = status.key,
            sortOrder = existing?.sortOrder ?: (allAttrs.size + 1),
            updatedAt = System.currentTimeMillis()
        )
        dao.upsertAttribute(saved)
        return Result.success(saved)
    }

    suspend fun saveValueSet(
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        attributeId: String?,
        status: RecordStatus
    ): Result<ValueSetEntity> {
        val trimmedAr = nameAr.trim()
        if (trimmedAr.isEmpty()) {
            return Result.failure(IllegalArgumentException("اسم مجموعة القيم بالعربية مطلوب."))
        }
        val key = DomainRules.normalizeKey(keyInput.ifBlank { nameEn ?: trimmedAr })
        if (status == RecordStatus.ARCHIVED && id != null) {
            val usedCount = dao.getAllBindings().count { it.valueSetId == id }
            if (usedCount > 0) {
                return Result.failure(
                    IllegalArgumentException("لا يمكن أرشفة مجموعة القيم لأنها مستخدمة في $usedCount من أنواع المنتجات.")
                )
            }
        }
        val existing = id?.let { dao.getAllValueSets().find { s -> s.id == it } }
        val saved = ValueSetEntity(
            id = existing?.id ?: "vset_${UUID.randomUUID().toString().take(10)}",
            key = key,
            nameAr = trimmedAr,
            nameEn = nameEn?.trim()?.takeIf { it.isNotEmpty() },
            attributeId = attributeId,
            status = status.key,
            sortOrder = existing?.sortOrder ?: (dao.getAllValueSets().size + 1),
            updatedAt = System.currentTimeMillis()
        )
        dao.upsertValueSet(saved)
        return Result.success(saved)
    }

    suspend fun saveAttributeValue(
        id: String?,
        valueSetId: String,
        valueKeyInput: String,
        labelAr: String,
        labelEn: String?,
        rawValue: String?,
        sortOrder: Int,
        status: RecordStatus
    ): Result<AttributeValueEntity> {
        val trimmedAr = labelAr.trim()
        if (trimmedAr.isEmpty()) {
            return Result.failure(IllegalArgumentException("التسمية العربية للقيمة مطلوبة."))
        }
        val key = DomainRules.normalizeKey(valueKeyInput.ifBlank { labelEn ?: trimmedAr })
        val entity = AttributeValueEntity(
            id = id ?: "val_${UUID.randomUUID().toString().take(10)}",
            valueSetId = valueSetId,
            valueKey = key,
            labelAr = trimmedAr,
            labelEn = labelEn?.trim()?.takeIf { it.isNotEmpty() },
            rawValue = rawValue?.trim()?.takeIf { it.isNotEmpty() },
            status = status.key,
            sortOrder = sortOrder,
            updatedAt = System.currentTimeMillis()
        )
        dao.upsertAttributeValue(entity)
        return Result.success(entity)
    }

    suspend fun saveDimension(
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        baseUnitKey: String?,
        baseUnitNameAr: String?,
        baseUnitSymbol: String?
    ): Result<MeasurementDimensionEntity> {
        val trimmedAr = nameAr.trim()
        if (trimmedAr.isEmpty()) {
            return Result.failure(IllegalArgumentException("اسم البُعد الفيزيائي مطلوب."))
        }
        val dimId = id ?: "dim_${UUID.randomUUID().toString().take(8)}"
        val dim = MeasurementDimensionEntity(
            id = dimId,
            key = DomainRules.normalizeKey(keyInput.ifBlank { nameEn ?: trimmedAr }),
            nameAr = trimmedAr,
            nameEn = nameEn?.trim()?.takeIf { it.isNotEmpty() }
        )
        dao.upsertDimension(dim)
        if (id == null && !baseUnitNameAr.isNullOrBlank()) {
            val baseUnit = MeasurementUnitEntity(
                id = "unit_${UUID.randomUUID().toString().take(8)}",
                dimensionId = dimId,
                key = DomainRules.normalizeKey(baseUnitKey ?: baseUnitNameAr),
                nameAr = baseUnitNameAr.trim(),
                symbol = baseUnitSymbol?.trim()?.takeIf { it.isNotEmpty() } ?: baseUnitNameAr.trim(),
                toBaseMultiplier = 1.0,
                toBaseOffset = 0.0,
                isBase = true
            )
            dao.upsertUnit(baseUnit)
        }
        return Result.success(dim)
    }

    suspend fun saveMeasurementUnit(
        id: String?,
        dimensionId: String,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        symbol: String?,
        toBaseMultiplier: Double,
        toBaseOffset: Double,
        status: RecordStatus
    ): Result<MeasurementUnitEntity> {
        if (nameAr.isBlank()) {
            return Result.failure(IllegalArgumentException("اسم الوحدة بالعربية مطلوب."))
        }
        if (!toBaseMultiplier.isFinite() || toBaseMultiplier <= 0.0) {
            return Result.failure(IllegalArgumentException("معامل التحويل (Multiplier) يجب أن يكون رقماً موجباً."))
        }
        val units = dao.getAllUnits().filter { it.dimensionId == dimensionId }
        val existing = id?.let { units.find { u -> u.id == it } }
        val isFirstBase = units.none { it.isBase && it.parsedStatus == RecordStatus.ACTIVE }
        val isBase = existing?.isBase ?: isFirstBase
        if (isBase && status == RecordStatus.ARCHIVED) {
            return Result.failure(
                IllegalArgumentException("لا يمكن أرشفة الوحدة الأساسية للبُعد قبل تعيين وحدة أساسية بديلة (Rebase).")
            )
        }
        val entity = MeasurementUnitEntity(
            id = existing?.id ?: "unit_${UUID.randomUUID().toString().take(8)}",
            dimensionId = dimensionId,
            key = DomainRules.normalizeKey(keyInput.ifBlank { nameEn ?: nameAr }),
            nameAr = nameAr.trim(),
            nameEn = nameEn?.trim()?.takeIf { it.isNotEmpty() },
            symbol = symbol?.trim()?.takeIf { it.isNotEmpty() },
            toBaseMultiplier = if (isBase) 1.0 else toBaseMultiplier,
            toBaseOffset = if (isBase) 0.0 else toBaseOffset,
            isBase = isBase,
            status = status.key,
            updatedAt = System.currentTimeMillis()
        )
        dao.upsertUnit(entity)
        return Result.success(entity)
    }

    /**
     * Transactional Base Unit Rebasing:
     * Sets targetUnitId as the single active base unit (multiplier=1, offset=0) for its dimension,
     * recalculates all sibling units' factors relative to the new base, and refreshes conversion rules.
     */
    suspend fun rebaseDimensionBaseUnit(targetUnitId: String): Result<String> {
        val allUnits = dao.getAllUnits()
        val newBase = allUnits.find { it.id == targetUnitId }
            ?: return Result.failure(IllegalArgumentException("الوحدة غير موجودة."))
        if (newBase.parsedStatus != RecordStatus.ACTIVE) {
            return Result.failure(IllegalArgumentException("يجب أن تكون الوحدة الأساسية الجديدة نشطة."))
        }
        val pivotM = newBase.toBaseMultiplier
        val pivotO = newBase.toBaseOffset
        if (pivotM <= 0.0) {
            return Result.failure(IllegalArgumentException("معامل الوحدة المختارة غير صالح."))
        }

        val siblingUnits = allUnits.filter { it.dimensionId == newBase.dimensionId }
        val updatedUnits = siblingUnits.map { unit ->
            if (unit.id == newBase.id) {
                unit.copy(
                    isBase = true,
                    toBaseMultiplier = 1.0,
                    toBaseOffset = 0.0,
                    updatedAt = System.currentTimeMillis()
                )
            } else {
                unit.copy(
                    isBase = false,
                    toBaseMultiplier = unit.toBaseMultiplier / pivotM,
                    toBaseOffset = (unit.toBaseOffset - pivotO) / pivotM,
                    updatedAt = System.currentTimeMillis()
                )
            }
        }

        val updatedUnitMap = updatedUnits.associateBy { it.id }
        val updatedRules = dao.getAllConversionRules().mapNotNull { rule ->
            val src = updatedUnitMap[rule.sourceUnitId]
            val dst = updatedUnitMap[rule.targetUnitId]
            if (src != null && dst != null) {
                val (m, o) = DomainRules.calculateDirectConversion(
                    src.dimensionId, src.toBaseMultiplier, src.toBaseOffset,
                    dst.dimensionId, dst.toBaseMultiplier, dst.toBaseOffset
                )
                rule.copy(multiplier = m, offsetValue = o, updatedAt = System.currentTimeMillis())
            } else null
        }

        dao.rebaseUnitsAndRules(updatedUnits, updatedRules)
        return Result.success("تم تعيين '${newBase.nameAr}' كوحدة أساسية وإعادة حساب جميع معاملات التحويل تلقائياً.")
    }

    suspend fun saveConversionRule(
        sourceUnitId: String,
        targetUnitId: String
    ): Result<UnitConversionRuleEntity> {
        if (sourceUnitId == targetUnitId) {
            return Result.failure(IllegalArgumentException("يجب اختيار وحدتين مختلفتين للتحويل."))
        }
        val allUnits = dao.getAllUnits().associateBy { it.id }
        val src = allUnits[sourceUnitId]
            ?: return Result.failure(IllegalArgumentException("وحدة المصدر غير موجودة."))
        val dst = allUnits[targetUnitId]
            ?: return Result.failure(IllegalArgumentException("وحدة الهدف غير موجودة."))
        if (src.dimensionId != dst.dimensionId) {
            return Result.failure(IllegalArgumentException("لا يمكن إنشاء قاعدة تحويل بين وحدات من أبعاد فيزيائية مختلفة."))
        }
        val (multiplier, offset) = DomainRules.calculateDirectConversion(
            src.dimensionId, src.toBaseMultiplier, src.toBaseOffset,
            dst.dimensionId, dst.toBaseMultiplier, dst.toBaseOffset
        )
        val rule = UnitConversionRuleEntity(
            id = "rule_${src.key}_to_${dst.key}",
            sourceUnitId = src.id,
            targetUnitId = dst.id,
            multiplier = multiplier,
            offsetValue = offset
        )
        dao.upsertConversionRule(rule)
        return Result.success(rule)
    }

    suspend fun deleteConversionRule(ruleId: String) {
        dao.deleteConversionRuleById(ruleId)
    }

    suspend fun syncWithSupabase(): Result<String> {
        return syncService.pullRemoteCatalog().map { (remoteNodes, remoteAttrs) ->
            if (remoteNodes.isNotEmpty()) {
                dao.upsertNodes(remoteNodes)
            }
            if (remoteAttrs.isNotEmpty()) {
                dao.upsertAttributes(remoteAttrs)
            }
            "تمت المزامنة مع Supabase بنجاح (${remoteNodes.size} تصنيف، ${remoteAttrs.size} خاصية)."
        }
    }

    suspend fun generateEnrichedExportJson(): String {
        val nodes = dao.getAllNodes()
        val attributes = dao.getAllAttributes().associateBy { it.id }
        val bindingsByNode = dao.getAllBindings().groupBy { it.productTypeNodeId }
        val units = dao.getAllUnits().associateBy { it.id }
        val valueSets = dao.getAllValueSets().associateBy { it.id }
        val valuesBySet = dao.getAllAttributeValues()
            .filter { it.parsedStatus == RecordStatus.ACTIVE }
            .groupBy { it.valueSetId }

        val exported = nodes.map { node ->
            val ancestors = getAncestors(node.id, nodes)
            val breadcrumbs = ancestors.map {
                EnrichedBreadcrumb(id = it.id, name_ar = it.nameAr, slug = it.slug)
            }
            val path = getFullPathAr(node.id, nodes)
            val nodeBindings = bindingsByNode[node.id].orEmpty().mapNotNull { binding ->
                val attr = attributes[binding.attributeId] ?: return@mapNotNull null
                val unit = binding.unitId?.let { units[it] }
                val valueSet = binding.valueSetId?.let { valueSets[it] }
                val resolvedValues = if (binding.valueSetId != null) {
                    valuesBySet[binding.valueSetId].orEmpty().map { it.labelAr }
                } else {
                    binding.allowedValues
                }
                EnrichedAttributeExport(
                    attribute_id = attr.id,
                    key = attr.key,
                    name_ar = attr.nameAr,
                    name_en = attr.nameEn,
                    data_type = attr.dataType,
                    filter_type = attr.filterType,
                    unit = unit?.symbol ?: attr.legacyUnit,
                    role = binding.role,
                    group = binding.groupName,
                    is_required = binding.isRequired,
                    is_filterable = binding.isFilterable,
                    is_variant = binding.isVariant,
                    min_value = binding.minValue,
                    max_value = binding.maxValue,
                    value_set_key = valueSet?.key,
                    allowed_values = resolvedValues
                )
            }
            EnrichedCategoryExport(
                id = node.id,
                name_ar = node.nameAr,
                name_en = node.nameEn,
                description = node.description.ifBlank { null },
                slug = node.slug,
                node_type = node.nodeType,
                status = node.status,
                parent_id = node.parentId,
                path = path,
                depth = ancestors.size,
                breadcrumbs = breadcrumbs,
                image = node.imagePath,
                attributes = nodeBindings
            )
        }
        return encodeEnrichedCatalog(exported)
    }
}
