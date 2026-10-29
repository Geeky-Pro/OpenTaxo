package com.ycp.taxonomyplanner.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.ycp.taxonomyplanner.data.CatalogRepository
import com.ycp.taxonomyplanner.data.local.AttributeEntity
import com.ycp.taxonomyplanner.data.local.AttributeValueEntity
import com.ycp.taxonomyplanner.data.local.MeasurementDimensionEntity
import com.ycp.taxonomyplanner.data.local.MeasurementUnitEntity
import com.ycp.taxonomyplanner.data.local.ProductTypeAttributeEntity
import com.ycp.taxonomyplanner.data.local.TaxonomyNodeEntity
import com.ycp.taxonomyplanner.data.local.UnitConversionRuleEntity
import com.ycp.taxonomyplanner.data.local.ValueSetEntity
import com.ycp.taxonomyplanner.domain.DataType
import com.ycp.taxonomyplanner.domain.FilterType
import com.ycp.taxonomyplanner.domain.NodeType
import com.ycp.taxonomyplanner.domain.RecordStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class WorkspaceRoute {
    DASHBOARD,
    TAXONOMY_LIST,
    TREE,
    BROWSE,
    DEFINITIONS_HUB,
    ATTRIBUTES_CENTER,
    DATA_TYPES_CENTER,
    VALUE_SETS_CENTER,
    MEASUREMENTS_CENTER,
    UNIT_CONVERSIONS_CENTER,
    CATEGORY_DETAIL
}

data class CatalogUiState(
    val nodes: List<TaxonomyNodeEntity> = emptyList(),
    val attributes: List<AttributeEntity> = emptyList(),
    val bindings: List<ProductTypeAttributeEntity> = emptyList(),
    val valueSets: List<ValueSetEntity> = emptyList(),
    val attributeValues: List<AttributeValueEntity> = emptyList(),
    val dimensions: List<MeasurementDimensionEntity> = emptyList(),
    val units: List<MeasurementUnitEntity> = emptyList(),
    val conversionRules: List<UnitConversionRuleEntity> = emptyList(),
    val currentRoute: WorkspaceRoute = WorkspaceRoute.DASHBOARD,
    val routeHistory: List<WorkspaceRoute> = emptyList(),
    val selectedCategoryId: String? = null,
    val browseCurrentNodeId: String? = null,
    val treeFocusedRootId: String? = null,
    val isDarkTheme: Boolean = false,
    val isOwnerUnlocked: Boolean = true,
    val isSpotlightOpen: Boolean = false,
    val isExportDialogOpen: Boolean = false,
    val isSyncDialogOpen: Boolean = false,
    val exportedJsonPreview: String = "",
    val isSyncing: Boolean = false,
    val supabaseConfigured: Boolean = false,
    val signedInOwnerEmail: String? = null,
    val snackbarMessage: String? = null
)

private data class LocalViewFlags(
    val currentRoute: WorkspaceRoute = WorkspaceRoute.DASHBOARD,
    val routeHistory: List<WorkspaceRoute> = emptyList(),
    val selectedCategoryId: String? = null,
    val browseCurrentNodeId: String? = null,
    val treeFocusedRootId: String? = null,
    val isDarkTheme: Boolean = false,
    val isOwnerUnlocked: Boolean = true,
    val isSpotlightOpen: Boolean = false,
    val isExportDialogOpen: Boolean = false,
    val isSyncDialogOpen: Boolean = false,
    val exportedJsonPreview: String = "",
    val isSyncing: Boolean = false,
    val signedInOwnerEmail: String? = null,
    val snackbarMessage: String? = null
)

class CatalogViewModel(
    val repository: CatalogRepository
) : ViewModel() {

    private val flags = MutableStateFlow(LocalViewFlags())

    private val primaryDataFlow = combine(
        repository.nodesFlow,
        repository.attributesFlow,
        repository.bindingsFlow,
        repository.valueSetsFlow,
        repository.attributeValuesFlow
    ) { nodes, attrs, bindings, valueSets, attrValues ->
        PrimaryCatalogSlice(nodes, attrs, bindings, valueSets, attrValues)
    }

    private val measurementDataFlow = combine(
        repository.dimensionsFlow,
        repository.unitsFlow,
        repository.conversionRulesFlow
    ) { dims, units, rules ->
        MeasurementSlice(dims, units, rules)
    }

    val uiState: StateFlow<CatalogUiState> = combine(
        primaryDataFlow,
        measurementDataFlow,
        flags
    ) { primary, measurement, f ->
        CatalogUiState(
            nodes = primary.nodes,
            attributes = primary.attributes,
            bindings = primary.bindings,
            valueSets = primary.valueSets,
            attributeValues = primary.attributeValues,
            dimensions = measurement.dimensions,
            units = measurement.units,
            conversionRules = measurement.conversionRules,
            currentRoute = f.currentRoute,
            routeHistory = f.routeHistory,
            selectedCategoryId = f.selectedCategoryId,
            browseCurrentNodeId = f.browseCurrentNodeId,
            treeFocusedRootId = f.treeFocusedRootId,
            isDarkTheme = f.isDarkTheme,
            isOwnerUnlocked = f.isOwnerUnlocked,
            isSpotlightOpen = f.isSpotlightOpen,
            isExportDialogOpen = f.isExportDialogOpen,
            isSyncDialogOpen = f.isSyncDialogOpen,
            exportedJsonPreview = f.exportedJsonPreview,
            isSyncing = f.isSyncing,
            supabaseConfigured = repository.syncService.isConfigured,
            signedInOwnerEmail = f.signedInOwnerEmail,
            snackbarMessage = f.snackbarMessage
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000L),
        initialValue = CatalogUiState(supabaseConfigured = repository.syncService.isConfigured)
    )

    init {
        viewModelScope.launch {
            repository.ensureSeeded()
        }
    }

    fun navigateTo(route: WorkspaceRoute) {
        flags.update { current ->
            if (current.currentRoute == route) current
            else current.copy(
                routeHistory = (current.routeHistory + current.currentRoute).takeLast(12),
                currentRoute = route
            )
        }
    }

    fun openCategoryDetail(categoryId: String) {
        flags.update { current ->
            current.copy(
                routeHistory = (current.routeHistory + current.currentRoute).takeLast(12),
                selectedCategoryId = categoryId,
                currentRoute = WorkspaceRoute.CATEGORY_DETAIL,
                isSpotlightOpen = false
            )
        }
    }

    fun openBrowseNode(nodeId: String?) {
        flags.update { current ->
            val nextHistory = if (current.currentRoute != WorkspaceRoute.BROWSE) {
                (current.routeHistory + current.currentRoute).takeLast(12)
            } else current.routeHistory
            current.copy(
                routeHistory = nextHistory,
                browseCurrentNodeId = nodeId,
                currentRoute = WorkspaceRoute.BROWSE,
                isSpotlightOpen = false
            )
        }
    }

    fun setTreeFocusRoot(nodeId: String?) {
        flags.update { it.copy(treeFocusedRootId = nodeId) }
    }

    fun navigateBack(): Boolean {
        val current = flags.value
        if (current.currentRoute == WorkspaceRoute.BROWSE && current.browseCurrentNodeId != null) {
            val node = uiState.value.nodes.find { it.id == current.browseCurrentNodeId }
            flags.update { it.copy(browseCurrentNodeId = node?.parentId) }
            return true
        }
        val previous = current.routeHistory.lastOrNull()
        return if (previous != null) {
            flags.update {
                it.copy(
                    currentRoute = previous,
                    routeHistory = it.routeHistory.dropLast(1)
                )
            }
            true
        } else if (current.currentRoute != WorkspaceRoute.DASHBOARD) {
            flags.update { it.copy(currentRoute = WorkspaceRoute.DASHBOARD) }
            true
        } else {
            false
        }
    }

    fun toggleDarkTheme() {
        flags.update { it.copy(isDarkTheme = !it.isDarkTheme) }
    }

    fun toggleOwnerLock() {
        flags.update {
            val next = !it.isOwnerUnlocked
            it.copy(
                isOwnerUnlocked = next,
                snackbarMessage = if (next) {
                    "تم فتح قفل المالك: يمكنك الآن إضافة وتعديل التصنيفات والتعريفات."
                } else {
                    "تم تفعيل قفل المالك (وضع القراءة فقط لحماية البنية)."
                }
            )
        }
    }

    fun setSpotlightOpen(open: Boolean) {
        flags.update { it.copy(isSpotlightOpen = open) }
    }

    fun setSyncDialogOpen(open: Boolean) {
        flags.update { it.copy(isSyncDialogOpen = open) }
    }

    fun openExportDialog() {
        viewModelScope.launch {
            val json = repository.generateEnrichedExportJson()
            flags.update {
                it.copy(
                    exportedJsonPreview = json,
                    isExportDialogOpen = true
                )
            }
        }
    }

    fun closeExportDialog() {
        flags.update { it.copy(isExportDialogOpen = false) }
    }

    fun clearSnackbar() {
        flags.update { it.copy(snackbarMessage = null) }
    }

    fun showMessage(msg: String) {
        flags.update { it.copy(snackbarMessage = msg) }
    }

    private fun checkOwnerUnlocked(): Boolean {
        if (!flags.value.isOwnerUnlocked) {
            showMessage("الكتالوج في وضع القراءة فقط. افتح قفل المالك من الشريط العلوي للتعديل.")
            return false
        }
        return true
    }

    fun saveNode(
        id: String?,
        nameAr: String,
        nameEn: String?,
        description: String,
        slugInput: String,
        nodeType: NodeType,
        parentId: String?,
        imagePath: String?,
        sortOrder: Int,
        status: RecordStatus,
        onSuccess: (TaxonomyNodeEntity) -> Unit = {}
    ) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveTaxonomyNode(
                id = id,
                nameAr = nameAr,
                nameEn = nameEn,
                description = description,
                slugInput = slugInput,
                nodeType = nodeType,
                parentId = parentId,
                imagePath = imagePath,
                sortOrder = sortOrder,
                status = status
            ).fold(
                onSuccess = { saved ->
                    showMessage("تم حفظ التصنيف '${saved.nameAr}' بنجاح.")
                    onSuccess(saved)
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر حفظ التصنيف.")
                }
            )
        }
    }

    fun archiveOrDeleteNode(nodeId: String, onFinished: () -> Unit = {}) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.archiveOrDeleteNode(nodeId).fold(
                onSuccess = { msg ->
                    showMessage(msg)
                    onFinished()
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر حذف/أرشفة التصنيف.")
                }
            )
        }
    }

    fun saveProductTypeBinding(
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
        sortOrder: Int,
        onSuccess: () -> Unit = {}
    ) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveProductTypeBinding(
                id = id,
                productTypeNodeId = productTypeNodeId,
                attributeId = attributeId,
                roleKey = roleKey,
                groupName = groupName,
                isRequired = isRequired,
                isFilterable = isFilterable,
                isVariant = isVariant,
                minValue = minValue,
                maxValue = maxValue,
                unitId = unitId,
                valueSetId = valueSetId,
                allowedValues = allowedValues,
                sortOrder = sortOrder
            ).fold(
                onSuccess = {
                    showMessage("تم حفظ إسناد الخاصية لنوع المنتج.")
                    onSuccess()
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر ربط الخاصية.")
                }
            )
        }
    }

    fun removeProductTypeBinding(bindingId: String) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.removeProductTypeBinding(bindingId)
            showMessage("تم إزالة ربط الخاصية.")
        }
    }

    fun saveAttributeDefinition(
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        dataType: DataType,
        filterType: FilterType,
        measurementDimensionId: String?,
        aliases: List<String>,
        status: RecordStatus,
        onSuccess: () -> Unit = {}
    ) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveAttributeDefinition(
                id = id,
                keyInput = keyInput,
                nameAr = nameAr,
                nameEn = nameEn,
                dataType = dataType,
                filterType = filterType,
                measurementDimensionId = measurementDimensionId,
                aliases = aliases,
                status = status
            ).fold(
                onSuccess = { saved ->
                    showMessage("تم حفظ تعريف الخاصية '${saved.nameAr}'.")
                    onSuccess()
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر حفظ الخاصية.")
                }
            )
        }
    }

    fun saveValueSet(
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        attributeId: String?,
        status: RecordStatus,
        onSuccess: () -> Unit = {}
    ) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveValueSet(id, keyInput, nameAr, nameEn, attributeId, status).fold(
                onSuccess = { saved ->
                    showMessage("تم حفظ مجموعة القيم '${saved.nameAr}'.")
                    onSuccess()
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر حفظ مجموعة القيم.")
                }
            )
        }
    }

    fun saveAttributeValue(
        id: String?,
        valueSetId: String,
        valueKeyInput: String,
        labelAr: String,
        labelEn: String?,
        rawValue: String?,
        sortOrder: Int,
        status: RecordStatus,
        onSuccess: () -> Unit = {}
    ) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveAttributeValue(
                id, valueSetId, valueKeyInput, labelAr, labelEn, rawValue, sortOrder, status
            ).fold(
                onSuccess = { saved ->
                    showMessage("تم حفظ القيمة '${saved.labelAr}'.")
                    onSuccess()
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر حفظ القيمة.")
                }
            )
        }
    }

    fun saveDimension(
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        baseUnitKey: String?,
        baseUnitNameAr: String?,
        baseUnitSymbol: String?,
        onSuccess: () -> Unit = {}
    ) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveDimension(
                id, keyInput, nameAr, nameEn, baseUnitKey, baseUnitNameAr, baseUnitSymbol
            ).fold(
                onSuccess = { saved ->
                    showMessage("تم حفظ البُعد الفيزيائي '${saved.nameAr}'.")
                    onSuccess()
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر حفظ البُعد.")
                }
            )
        }
    }

    fun saveMeasurementUnit(
        id: String?,
        dimensionId: String,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        symbol: String?,
        toBaseMultiplier: Double,
        toBaseOffset: Double,
        status: RecordStatus,
        onSuccess: () -> Unit = {}
    ) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveMeasurementUnit(
                id, dimensionId, keyInput, nameAr, nameEn, symbol, toBaseMultiplier, toBaseOffset, status
            ).fold(
                onSuccess = { saved ->
                    showMessage("تم حفظ وحدة القياس '${saved.nameAr}'.")
                    onSuccess()
                },
                onFailure = { err ->
                    showMessage(err.message ?: "تعذر حفظ وحدة القياس.")
                }
            )
        }
    }

    fun rebaseBaseUnit(unitId: String) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.rebaseDimensionBaseUnit(unitId).fold(
                onSuccess = { msg -> showMessage(msg) },
                onFailure = { err -> showMessage(err.message ?: "تعذر إعادة تعيين الوحدة الأساسية.") }
            )
        }
    }

    fun saveConversionRule(sourceUnitId: String, targetUnitId: String) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.saveConversionRule(sourceUnitId, targetUnitId).fold(
                onSuccess = { showMessage("تم حفظ قاعدة التحويل الصريحة.") },
                onFailure = { err -> showMessage(err.message ?: "تعذر حفظ قاعدة التحويل.") }
            )
        }
    }

    fun deleteConversionRule(ruleId: String) {
        if (!checkOwnerUnlocked()) return
        viewModelScope.launch {
            repository.deleteConversionRule(ruleId)
            showMessage("تم حذف قاعدة التحويل.")
        }
    }

    fun signInSupabaseOwner(email: String, password: String) {
        viewModelScope.launch {
            flags.update { it.copy(isSyncing = true) }
            repository.syncService.signInOwner(email, password).fold(
                onSuccess = { signedIn ->
                    flags.update {
                        it.copy(
                            isSyncing = false,
                            signedInOwnerEmail = signedIn,
                            isOwnerUnlocked = true,
                            snackbarMessage = "تم تسجيل دخول المالك ($signedIn) بنجاح."
                        )
                    }
                },
                onFailure = { err ->
                    flags.update {
                        it.copy(
                            isSyncing = false,
                            snackbarMessage = err.message ?: "فشل تسجيل الدخول."
                        )
                    }
                }
            )
        }
    }

    fun signOutSupabaseOwner() {
        repository.syncService.signOut()
        flags.update {
            it.copy(
                signedInOwnerEmail = null,
                snackbarMessage = "تم تسجيل الخروج من جلسة Supabase."
            )
        }
    }

    fun syncWithSupabase() {
        viewModelScope.launch {
            flags.update { it.copy(isSyncing = true) }
            repository.syncWithSupabase().fold(
                onSuccess = { msg ->
                    flags.update { it.copy(isSyncing = false, snackbarMessage = msg) }
                },
                onFailure = { err ->
                    flags.update {
                        it.copy(
                            isSyncing = false,
                            snackbarMessage = err.message ?: "تعذرت المزامنة مع Supabase."
                        )
                    }
                }
            )
        }
    }

    companion object {
        fun provideFactory(repository: CatalogRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return CatalogViewModel(repository) as T
                }
            }
    }
}

private data class PrimaryCatalogSlice(
    val nodes: List<TaxonomyNodeEntity>,
    val attributes: List<AttributeEntity>,
    val bindings: List<ProductTypeAttributeEntity>,
    val valueSets: List<ValueSetEntity>,
    val attributeValues: List<AttributeValueEntity>
)

private data class MeasurementSlice(
    val dimensions: List<MeasurementDimensionEntity>,
    val units: List<MeasurementUnitEntity>,
    val conversionRules: List<UnitConversionRuleEntity>
)
