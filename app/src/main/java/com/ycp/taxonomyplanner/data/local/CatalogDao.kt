package com.ycp.taxonomyplanner.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface CatalogDao {

    @Query("SELECT * FROM taxonomy_nodes ORDER BY sortOrder ASC, nameAr ASC")
    fun observeNodes(): Flow<List<TaxonomyNodeEntity>>

    @Query("SELECT * FROM taxonomy_nodes ORDER BY sortOrder ASC, nameAr ASC")
    suspend fun getAllNodes(): List<TaxonomyNodeEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertNode(node: TaxonomyNodeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertNodes(nodes: List<TaxonomyNodeEntity>)

    @Query("DELETE FROM taxonomy_nodes WHERE id = :id")
    suspend fun deleteNodeById(id: String)

    @Query("SELECT * FROM attributes ORDER BY sortOrder ASC, nameAr ASC")
    fun observeAttributes(): Flow<List<AttributeEntity>>

    @Query("SELECT * FROM attributes ORDER BY sortOrder ASC, nameAr ASC")
    suspend fun getAllAttributes(): List<AttributeEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAttribute(attribute: AttributeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAttributes(attributes: List<AttributeEntity>)

    @Query("DELETE FROM attributes WHERE id = :id")
    suspend fun deleteAttributeById(id: String)

    @Query("SELECT * FROM product_type_attributes ORDER BY sortOrder ASC")
    fun observeBindings(): Flow<List<ProductTypeAttributeEntity>>

    @Query("SELECT * FROM product_type_attributes ORDER BY sortOrder ASC")
    suspend fun getAllBindings(): List<ProductTypeAttributeEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBinding(binding: ProductTypeAttributeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBindings(bindings: List<ProductTypeAttributeEntity>)

    @Query("DELETE FROM product_type_attributes WHERE id = :id")
    suspend fun deleteBindingById(id: String)

    @Query("DELETE FROM product_type_attributes WHERE productTypeNodeId = :nodeId")
    suspend fun deleteBindingsForNode(nodeId: String)

    @Query("SELECT * FROM attribute_value_sets ORDER BY sortOrder ASC, nameAr ASC")
    fun observeValueSets(): Flow<List<ValueSetEntity>>

    @Query("SELECT * FROM attribute_value_sets ORDER BY sortOrder ASC, nameAr ASC")
    suspend fun getAllValueSets(): List<ValueSetEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertValueSet(valueSet: ValueSetEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertValueSets(valueSets: List<ValueSetEntity>)

    @Query("SELECT * FROM attribute_values ORDER BY sortOrder ASC, labelAr ASC")
    fun observeAttributeValues(): Flow<List<AttributeValueEntity>>

    @Query("SELECT * FROM attribute_values ORDER BY sortOrder ASC, labelAr ASC")
    suspend fun getAllAttributeValues(): List<AttributeValueEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAttributeValue(value: AttributeValueEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAttributeValues(values: List<AttributeValueEntity>)

    @Query("DELETE FROM attribute_values WHERE id = :id")
    suspend fun deleteAttributeValueById(id: String)

    @Query("SELECT * FROM measurement_dimensions ORDER BY nameAr ASC")
    fun observeDimensions(): Flow<List<MeasurementDimensionEntity>>

    @Query("SELECT * FROM measurement_dimensions ORDER BY nameAr ASC")
    suspend fun getAllDimensions(): List<MeasurementDimensionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDimension(dimension: MeasurementDimensionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertDimensions(dimensions: List<MeasurementDimensionEntity>)

    @Query("SELECT * FROM measurement_units ORDER BY isBase DESC, key ASC")
    fun observeUnits(): Flow<List<MeasurementUnitEntity>>

    @Query("SELECT * FROM measurement_units ORDER BY isBase DESC, key ASC")
    suspend fun getAllUnits(): List<MeasurementUnitEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertUnit(unit: MeasurementUnitEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertUnits(units: List<MeasurementUnitEntity>)

    @Query("SELECT * FROM unit_conversion_rules ORDER BY updatedAt DESC")
    fun observeConversionRules(): Flow<List<UnitConversionRuleEntity>>

    @Query("SELECT * FROM unit_conversion_rules ORDER BY updatedAt DESC")
    suspend fun getAllConversionRules(): List<UnitConversionRuleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertConversionRule(rule: UnitConversionRuleEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertConversionRules(rules: List<UnitConversionRuleEntity>)

    @Query("DELETE FROM unit_conversion_rules WHERE id = :id")
    suspend fun deleteConversionRuleById(id: String)

    @Transaction
    suspend fun rebaseUnitsAndRules(
        updatedUnits: List<MeasurementUnitEntity>,
        updatedRules: List<UnitConversionRuleEntity>
    ) {
        upsertUnits(updatedUnits)
        if (updatedRules.isNotEmpty()) {
            upsertConversionRules(updatedRules)
        }
    }
}
