package com.ycp.taxonomyplanner.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.ycp.taxonomyplanner.domain.AttributeRole
import com.ycp.taxonomyplanner.domain.DataType
import com.ycp.taxonomyplanner.domain.FilterType
import com.ycp.taxonomyplanner.domain.NodeType
import com.ycp.taxonomyplanner.domain.RecordStatus
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "taxonomy_nodes")
data class TaxonomyNodeEntity(
    @PrimaryKey val id: String,
    val legacyId: String? = null,
    val nodeType: String = NodeType.CATEGORY.key,
    val nameAr: String,
    val nameEn: String? = null,
    val description: String = "",
    val slug: String,
    val parentId: String? = null,
    val imagePath: String? = null,
    val sortOrder: Int = 0,
    val status: String = RecordStatus.ACTIVE.key,
    val isLegacyMismatch: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
) {
    val parsedNodeType: NodeType get() = NodeType.fromKey(nodeType)
    val parsedStatus: RecordStatus get() = RecordStatus.fromKey(status)
}

@Serializable
@Entity(tableName = "attributes")
data class AttributeEntity(
    @PrimaryKey val id: String,
    val key: String,
    val nameAr: String,
    val nameEn: String? = null,
    val dataType: String = DataType.STRING.key,
    val filterType: String = FilterType.SELECT.key,
    val measurementDimensionId: String? = null,
    val legacyUnit: String? = null,
    val aliasesCsv: String = "",
    val status: String = RecordStatus.ACTIVE.key,
    val sortOrder: Int = 0,
    val updatedAt: Long = System.currentTimeMillis()
) {
    val parsedDataType: DataType get() = DataType.fromKey(dataType)
    val parsedFilterType: FilterType get() = FilterType.fromKey(filterType)
    val parsedStatus: RecordStatus get() = RecordStatus.fromKey(status)
    val aliases: List<String>
        get() = aliasesCsv.split("|").map { it.trim() }.filter { it.isNotEmpty() }
}

@Serializable
@Entity(tableName = "product_type_attributes")
data class ProductTypeAttributeEntity(
    @PrimaryKey val id: String,
    val productTypeNodeId: String,
    val attributeId: String,
    val role: String = AttributeRole.DESCRIPTIVE.key,
    val groupName: String = "المواصفات الأساسية",
    val isRequired: Boolean = false,
    val isFilterable: Boolean = true,
    val isVariant: Boolean = false,
    val minValue: Double? = null,
    val maxValue: Double? = null,
    val unitId: String? = null,
    val valueSetId: String? = null,
    val allowedValuesCsv: String = "",
    val sortOrder: Int = 0
) {
    val parsedRole: AttributeRole get() = AttributeRole.fromKey(role)
    val allowedValues: List<String>
        get() = allowedValuesCsv.split("|").map { it.trim() }.filter { it.isNotEmpty() }
}

@Serializable
@Entity(tableName = "attribute_value_sets")
data class ValueSetEntity(
    @PrimaryKey val id: String,
    val key: String,
    val nameAr: String,
    val nameEn: String? = null,
    val attributeId: String? = null,
    val status: String = RecordStatus.ACTIVE.key,
    val sortOrder: Int = 0,
    val updatedAt: Long = System.currentTimeMillis()
) {
    val parsedStatus: RecordStatus get() = RecordStatus.fromKey(status)
}

@Serializable
@Entity(tableName = "attribute_values")
data class AttributeValueEntity(
    @PrimaryKey val id: String,
    val valueSetId: String,
    val valueKey: String,
    val labelAr: String,
    val labelEn: String? = null,
    val rawValue: String? = null,
    val status: String = RecordStatus.ACTIVE.key,
    val sortOrder: Int = 0,
    val updatedAt: Long = System.currentTimeMillis()
) {
    val parsedStatus: RecordStatus get() = RecordStatus.fromKey(status)
}

@Serializable
@Entity(tableName = "measurement_dimensions")
data class MeasurementDimensionEntity(
    @PrimaryKey val id: String,
    val key: String,
    val nameAr: String,
    val nameEn: String? = null,
    val status: String = RecordStatus.ACTIVE.key,
    val updatedAt: Long = System.currentTimeMillis()
) {
    val parsedStatus: RecordStatus get() = RecordStatus.fromKey(status)
}

@Serializable
@Entity(tableName = "measurement_units")
data class MeasurementUnitEntity(
    @PrimaryKey val id: String,
    val dimensionId: String,
    val key: String,
    val nameAr: String,
    val nameEn: String? = null,
    val symbol: String? = null,
    val toBaseMultiplier: Double = 1.0,
    val toBaseOffset: Double = 0.0,
    val isBase: Boolean = false,
    val status: String = RecordStatus.ACTIVE.key,
    val updatedAt: Long = System.currentTimeMillis()
) {
    val parsedStatus: RecordStatus get() = RecordStatus.fromKey(status)
}

@Serializable
@Entity(tableName = "unit_conversion_rules")
data class UnitConversionRuleEntity(
    @PrimaryKey val id: String,
    val sourceUnitId: String,
    val targetUnitId: String,
    val multiplier: Double,
    val offsetValue: Double = 0.0,
    val status: String = RecordStatus.ACTIVE.key,
    val updatedAt: Long = System.currentTimeMillis()
) {
    val parsedStatus: RecordStatus get() = RecordStatus.fromKey(status)
}
