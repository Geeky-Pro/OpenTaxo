package com.ycp.taxonomyplanner.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.ycp.taxonomyplanner.domain.AttributeRole
import com.ycp.taxonomyplanner.domain.DataType
import com.ycp.taxonomyplanner.domain.FilterType
import com.ycp.taxonomyplanner.domain.NodeType
import com.ycp.taxonomyplanner.domain.RecordStatus

@Database(
    entities = [
        TaxonomyNodeEntity::class,
        AttributeEntity::class,
        ProductTypeAttributeEntity::class,
        ValueSetEntity::class,
        AttributeValueEntity::class,
        MeasurementDimensionEntity::class,
        MeasurementUnitEntity::class,
        UnitConversionRuleEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class CatalogDatabase : RoomDatabase() {

    abstract fun catalogDao(): CatalogDao

    companion object {
        @Volatile
        private var INSTANCE: CatalogDatabase? = null

        fun getInstance(context: Context): CatalogDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    CatalogDatabase::class.java,
                    "ycp_taxonomy_planner.db"
                )
                    .fallbackToDestructiveMigration(true)
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}

object SeedCatalogData {

    fun initialDimensions(): List<MeasurementDimensionEntity> = listOf(
        MeasurementDimensionEntity(
            id = "dim_weight",
            key = "weight",
            nameAr = "الوزن والكتلة",
            nameEn = "Weight & Mass"
        ),
        MeasurementDimensionEntity(
            id = "dim_length",
            key = "length",
            nameAr = "الطول والأبعاد",
            nameEn = "Length & Dimensions"
        ),
        MeasurementDimensionEntity(
            id = "dim_power",
            key = "electric_power",
            nameAr = "القدرة الكهربائية",
            nameEn = "Electrical Power"
        ),
        MeasurementDimensionEntity(
            id = "dim_pressure",
            key = "pressure",
            nameAr = "الضغط",
            nameEn = "Pressure"
        )
    )

    fun initialUnits(): List<MeasurementUnitEntity> = listOf(
        MeasurementUnitEntity(
            id = "unit_kg",
            dimensionId = "dim_weight",
            key = "kg",
            nameAr = "كيلوغرام",
            nameEn = "Kilogram",
            symbol = "كغ",
            toBaseMultiplier = 1.0,
            toBaseOffset = 0.0,
            isBase = true
        ),
        MeasurementUnitEntity(
            id = "unit_g",
            dimensionId = "dim_weight",
            key = "gram",
            nameAr = "غرام",
            nameEn = "Gram",
            symbol = "غ",
            toBaseMultiplier = 0.001,
            toBaseOffset = 0.0,
            isBase = false
        ),
        MeasurementUnitEntity(
            id = "unit_ton",
            dimensionId = "dim_weight",
            key = "metric_ton",
            nameAr = "طن متري",
            nameEn = "Metric Ton",
            symbol = "طن",
            toBaseMultiplier = 1000.0,
            toBaseOffset = 0.0,
            isBase = false
        ),
        MeasurementUnitEntity(
            id = "unit_m",
            dimensionId = "dim_length",
            key = "meter",
            nameAr = "متر",
            nameEn = "Meter",
            symbol = "م",
            toBaseMultiplier = 1.0,
            toBaseOffset = 0.0,
            isBase = true
        ),
        MeasurementUnitEntity(
            id = "unit_cm",
            dimensionId = "dim_length",
            key = "centimeter",
            nameAr = "سنتيمتر",
            nameEn = "Centimeter",
            symbol = "سم",
            toBaseMultiplier = 0.01,
            toBaseOffset = 0.0,
            isBase = false
        ),
        MeasurementUnitEntity(
            id = "unit_inch",
            dimensionId = "dim_length",
            key = "inch",
            nameAr = "بوصة",
            nameEn = "Inch",
            symbol = "بوصة",
            toBaseMultiplier = 0.0254,
            toBaseOffset = 0.0,
            isBase = false
        ),
        MeasurementUnitEntity(
            id = "unit_watt",
            dimensionId = "dim_power",
            key = "watt",
            nameAr = "واط",
            nameEn = "Watt",
            symbol = "W",
            toBaseMultiplier = 1.0,
            toBaseOffset = 0.0,
            isBase = true
        ),
        MeasurementUnitEntity(
            id = "unit_kw",
            dimensionId = "dim_power",
            key = "kilowatt",
            nameAr = "كيلوواط",
            nameEn = "Kilowatt",
            symbol = "kW",
            toBaseMultiplier = 1000.0,
            toBaseOffset = 0.0,
            isBase = false
        ),
        MeasurementUnitEntity(
            id = "unit_bar",
            dimensionId = "dim_pressure",
            key = "bar",
            nameAr = "بار",
            nameEn = "Bar",
            symbol = "bar",
            toBaseMultiplier = 1.0,
            toBaseOffset = 0.0,
            isBase = true
        ),
        MeasurementUnitEntity(
            id = "unit_psi",
            dimensionId = "dim_pressure",
            key = "psi",
            nameAr = "رطل لكل بوصة مربعة",
            nameEn = "PSI",
            symbol = "psi",
            toBaseMultiplier = 0.0689476,
            toBaseOffset = 0.0,
            isBase = false
        )
    )

    fun initialConversionRules(): List<UnitConversionRuleEntity> = listOf(
        UnitConversionRuleEntity(
            id = "rule_kg_to_g",
            sourceUnitId = "unit_kg",
            targetUnitId = "unit_g",
            multiplier = 1000.0,
            offsetValue = 0.0
        ),
        UnitConversionRuleEntity(
            id = "rule_m_to_cm",
            sourceUnitId = "unit_m",
            targetUnitId = "unit_cm",
            multiplier = 100.0,
            offsetValue = 0.0
        ),
        UnitConversionRuleEntity(
            id = "rule_kw_to_w",
            sourceUnitId = "unit_kw",
            targetUnitId = "unit_watt",
            multiplier = 1000.0,
            offsetValue = 0.0
        )
    )

    fun initialAttributes(): List<AttributeEntity> = listOf(
        AttributeEntity(
            id = "attr_color",
            key = "color",
            nameAr = "اللون",
            nameEn = "Color",
            dataType = DataType.ENUM.key,
            filterType = FilterType.COLOR_SWATCH.key,
            aliasesCsv = "لون المنتج|درجة اللون|Color Shade",
            sortOrder = 1
        ),
        AttributeEntity(
            id = "attr_size",
            key = "size",
            nameAr = "المقاس",
            nameEn = "Size",
            dataType = DataType.ENUM.key,
            filterType = FilterType.BUTTON_GROUP.key,
            aliasesCsv = "الحجم|القياس|Standard Size",
            sortOrder = 2
        ),
        AttributeEntity(
            id = "attr_material",
            key = "material",
            nameAr = "المادة",
            nameEn = "Material",
            dataType = DataType.STRING.key,
            filterType = FilterType.CHECKBOX.key,
            aliasesCsv = "الخامة|مادة الصنع",
            sortOrder = 3
        ),
        AttributeEntity(
            id = "attr_weight",
            key = "weight",
            nameAr = "الوزن",
            nameEn = "Weight",
            dataType = DataType.NUMBER.key,
            filterType = FilterType.RANGE.key,
            measurementDimensionId = "dim_weight",
            legacyUnit = "كغ",
            aliasesCsv = "الوزن الصافي|كتلة المنتج",
            sortOrder = 4
        ),
        AttributeEntity(
            id = "attr_brand",
            key = "brand",
            nameAr = "العلامة التجارية",
            nameEn = "Brand",
            dataType = DataType.STRING.key,
            filterType = FilterType.SELECT.key,
            aliasesCsv = "الماركة|الشركة المصنعة",
            sortOrder = 5
        ),
        AttributeEntity(
            id = "attr_waterproof",
            key = "waterproof",
            nameAr = "مقاوم للماء",
            nameEn = "Waterproof",
            dataType = DataType.BOOLEAN.key,
            filterType = FilterType.TOGGLE.key,
            aliasesCsv = "ضد الماء|مقاومة الرطوبة",
            sortOrder = 6
        ),
        AttributeEntity(
            id = "attr_model",
            key = "model_number",
            nameAr = "الموديل",
            nameEn = "Model",
            dataType = DataType.STRING.key,
            filterType = FilterType.SELECT.key,
            aliasesCsv = "رقم الطراز|Model Code",
            sortOrder = 7
        ),
        AttributeEntity(
            id = "attr_power",
            key = "power_wattage",
            nameAr = "الاستطاعة الكهربائية",
            nameEn = "Power Wattage",
            dataType = DataType.NUMBER.key,
            filterType = FilterType.RANGE.key,
            measurementDimensionId = "dim_power",
            legacyUnit = "W",
            aliasesCsv = "القدرة بالواط|استهلاك الطاقة",
            sortOrder = 8
        ),
        AttributeEntity(
            id = "attr_pressure",
            key = "operating_pressure",
            nameAr = "الضغط التشغيلي",
            nameEn = "Operating Pressure",
            dataType = DataType.NUMBER.key,
            filterType = FilterType.RANGE.key,
            measurementDimensionId = "dim_pressure",
            legacyUnit = "bar",
            aliasesCsv = "ضغط التحمل|الضغط الأقصى",
            sortOrder = 9
        )
    )

    fun initialValueSets(): List<ValueSetEntity> = listOf(
        ValueSetEntity(
            id = "vset_lighting_colors",
            key = "lighting_color_temperatures",
            nameAr = "ألوان الإضاءة وحرارة اللون",
            nameEn = "Lighting Colors",
            attributeId = "attr_color",
            sortOrder = 1
        ),
        ValueSetEntity(
            id = "vset_standard_sizes",
            key = "standard_sizes",
            nameAr = "المقاسات القياسية والقاعدة",
            nameEn = "Standard Socket & Pipe Sizes",
            attributeId = "attr_size",
            sortOrder = 2
        )
    )

    fun initialAttributeValues(): List<AttributeValueEntity> = listOf(
        AttributeValueEntity(
            id = "val_warm_white",
            valueSetId = "vset_lighting_colors",
            valueKey = "warm_white_3000k",
            labelAr = "أصفر دافئ (3000K)",
            labelEn = "Warm White 3000K",
            rawValue = "#FCD34D",
            sortOrder = 1
        ),
        AttributeValueEntity(
            id = "val_daylight",
            valueSetId = "vset_lighting_colors",
            valueKey = "daylight_6500k",
            labelAr = "أبيض نهاري (6500K)",
            labelEn = "Daylight 6500K",
            rawValue = "#F8FAFC",
            sortOrder = 2
        ),
        AttributeValueEntity(
            id = "val_cool_white",
            valueSetId = "vset_lighting_colors",
            valueKey = "neutral_4000k",
            labelAr = "أبيض طبيعي (4000K)",
            labelEn = "Neutral White 4000K",
            rawValue = "#FEF08A",
            sortOrder = 3
        ),
        AttributeValueEntity(
            id = "val_e27",
            valueSetId = "vset_standard_sizes",
            valueKey = "socket_e27",
            labelAr = "قاعدة عريضة E27",
            labelEn = "E27 Standard",
            rawValue = "E27",
            sortOrder = 1
        ),
        AttributeValueEntity(
            id = "val_e14",
            valueSetId = "vset_standard_sizes",
            valueKey = "socket_e14",
            labelAr = "قاعدة رفيعة E14",
            labelEn = "E14 Candelabra",
            rawValue = "E14",
            sortOrder = 2
        ),
        AttributeValueEntity(
            id = "val_gu10",
            valueSetId = "vset_standard_sizes",
            valueKey = "socket_gu10",
            labelAr = "قاعدة سبوت GU10",
            labelEn = "GU10",
            rawValue = "GU10",
            sortOrder = 3
        )
    )

    fun initialNodes(): List<TaxonomyNodeEntity> = listOf(
        TaxonomyNodeEntity(
            id = "cat_pqltDmsuoSbhhB9WstGG4",
            legacyId = "cat_pqltDmsuoSbhhB9WstGG4",
            nodeType = NodeType.DEPARTMENT.key,
            nameAr = "الكهرباء",
            nameEn = "Electricity",
            description = "قسم مستلزمات الكهرباء والإنارة والتمديدات الكهربائية واللوحات.",
            slug = "electricity",
            parentId = null,
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat__-ndHslQdxz0wtvEdkaZ-",
            legacyId = "cat__-ndHslQdxz0wtvEdkaZ-",
            nodeType = NodeType.CATEGORY.key,
            nameAr = "الإنارة",
            nameEn = "Lighting",
            description = "وحدات الإنارة الداخلية والخارجية والديكورية واللمبات الموفرة للطاقة.",
            slug = "alanarh",
            parentId = "cat_pqltDmsuoSbhhB9WstGG4",
            imagePath = "drawable://cat_alanarh",
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat_JhxzaGMAzmBVD1L5ywPlo",
            legacyId = "cat_JhxzaGMAzmBVD1L5ywPlo",
            nodeType = NodeType.SUBCATEGORY.key,
            nameAr = "إنارة داخلية",
            nameEn = "Indoor Lighting",
            description = "مستلزمات الإضاءة الداخلية للمنازل والمكاتب والصالات.",
            slug = "indoor-lighting",
            parentId = "cat__-ndHslQdxz0wtvEdkaZ-",
            imagePath = "drawable://cat_indoor_lighting",
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat_vwmAm8QC837PNj_3Xik8_",
            legacyId = "cat_vwmAm8QC837PNj_3Xik8_",
            nodeType = NodeType.SUBCATEGORY.key,
            nameAr = "إنارة خارجية",
            nameEn = "Outdoor Lighting",
            description = "كشافات الحدائق والواجهات المقاومة للعوامل الجوية.",
            slug = "outdoor-lighting",
            parentId = "cat__-ndHslQdxz0wtvEdkaZ-",
            imagePath = "drawable://cat_outdoor_lighting",
            sortOrder = 2
        ),
        TaxonomyNodeEntity(
            id = "cat_vwVkn2V9XBW9gDcITH8ot",
            legacyId = "cat_vwVkn2V9XBW9gDcITH8ot",
            nodeType = NodeType.SUBCATEGORY.key,
            nameAr = "إنارة ديكورية",
            nameEn = "Decorative Lighting",
            description = "ثريات وإضاءات جدارية ومعلقات ديكورية حديثة.",
            slug = "decorative-lighting",
            parentId = "cat__-ndHslQdxz0wtvEdkaZ-",
            imagePath = "drawable://cat_decorative_lighting",
            sortOrder = 3
        ),
        TaxonomyNodeEntity(
            id = "cat_RytJK4v1u5GdfBGZK6AC3",
            legacyId = "cat_RytJK4v1u5GdfBGZK6AC3",
            nodeType = NodeType.SUBCATEGORY.key,
            nameAr = "إكسسوارات وملحقات الإنارة",
            nameEn = "Lighting Accessories",
            description = "ترانسات، قواعد توصيل، وحساسات حركة للإضاءة.",
            slug = "lighting-accessories",
            parentId = "cat__-ndHslQdxz0wtvEdkaZ-",
            imagePath = "drawable://cat_lighting_accessories",
            sortOrder = 4
        ),
        TaxonomyNodeEntity(
            id = "cat_OhQ4h9RnmALzJLaOuldAE",
            legacyId = "cat_OhQ4h9RnmALzJLaOuldAE",
            nodeType = NodeType.CATEGORY.key,
            nameAr = "المفاتيح والأفياش",
            nameEn = "Sockets & Switches",
            description = "مفاتيح الإنارة والأفياش الجدارية ومخارج الطاقة الذكية.",
            slug = "sockets",
            parentId = "cat_pqltDmsuoSbhhB9WstGG4",
            imagePath = "drawable://cat_sockets",
            sortOrder = 2
        ),
        TaxonomyNodeEntity(
            id = "cat_U24VqYORYXPSlfx8EZIpG",
            legacyId = "cat_U24VqYORYXPSlfx8EZIpG",
            nodeType = NodeType.PRODUCT_TYPE.key,
            nameAr = "لمبات ليد LED",
            nameEn = "LED Bulbs",
            description = "نوع المنتج النهائي للمبات LED الموفرة للطاقة بمختلف القواعد والاستطاعات.",
            slug = "led-bulbs",
            parentId = "cat_JhxzaGMAzmBVD1L5ywPlo",
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat_electronics",
            legacyId = "cat_electronics",
            nodeType = NodeType.DEPARTMENT.key,
            nameAr = "إلكترونيات",
            nameEn = "Electronics",
            description = "الأجهزة الإلكترونية الاستهلاكية وأجهزة الاتصالات والحوسبة.",
            slug = "electronics",
            parentId = null,
            sortOrder = 2
        ),
        TaxonomyNodeEntity(
            id = "cat_phones",
            legacyId = "cat_phones",
            nodeType = NodeType.CATEGORY.key,
            nameAr = "هواتف",
            nameEn = "Phones",
            description = "الهواتف المحمولة وملحقاتها.",
            slug = "phones",
            parentId = "cat_electronics",
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat_smartphones",
            legacyId = "cat_smartphones",
            nodeType = NodeType.PRODUCT_TYPE.key,
            nameAr = "هواتف ذكية",
            nameEn = "Smartphones",
            description = "الهواتف الذكية بمختلف أنظمة التشغيل وسعات التخزين.",
            slug = "smartphones",
            parentId = "cat_phones",
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat_laptops",
            legacyId = "cat_laptops",
            nodeType = NodeType.CATEGORY.key,
            nameAr = "حواسيب محمولة",
            nameEn = "Laptops",
            description = "أجهزة الحاسوب المحمولة للأعمال والتصميم.",
            slug = "laptops",
            parentId = "cat_electronics",
            sortOrder = 2
        ),
        TaxonomyNodeEntity(
            id = "cat_fashion",
            legacyId = "cat_fashion",
            nodeType = NodeType.DEPARTMENT.key,
            nameAr = "مواد البناء",
            nameEn = "Building Materials",
            description = "مواد البناء الأساسية والتشطيبات والعزل.",
            slug = "building-materials",
            parentId = null,
            sortOrder = 3
        ),
        TaxonomyNodeEntity(
            id = "cat_sMo5utmJJl59NwepQVJcS",
            legacyId = "cat_sMo5utmJJl59NwepQVJcS",
            nodeType = NodeType.DEPARTMENT.key,
            nameAr = "السباكة والأدوات الصحية",
            nameEn = "Plumbing & Sanitary Tools",
            description = "أنظمة الأنابيب والمواصير والخلاطات والأدوات الصحية.",
            slug = "plumbing-and-sanitary-tools",
            parentId = null,
            sortOrder = 4
        ),
        TaxonomyNodeEntity(
            id = "cat_pipes",
            legacyId = "cat_pipes",
            nodeType = NodeType.CATEGORY.key,
            nameAr = "المواصير",
            nameEn = "Pipes & Fittings",
            description = "مواصير التغذية والصرف الحرارية والـ PVC.",
            slug = "pipes",
            parentId = "cat_sMo5utmJJl59NwepQVJcS",
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat_ppr_pipe_pt",
            legacyId = null,
            nodeType = NodeType.PRODUCT_TYPE.key,
            nameAr = "مواصير حرارية PPR",
            nameEn = "PPR Thermal Pipes",
            description = "مواصير مياه حرارية مقاومة للضغط والحرارة العالية.",
            slug = "ppr-thermal-pipes",
            parentId = "cat_pipes",
            sortOrder = 1
        ),
        TaxonomyNodeEntity(
            id = "cat_bdA6rAzeZzoHTP-jtyoBV",
            legacyId = "cat_bdA6rAzeZzoHTP-jtyoBV",
            nodeType = NodeType.DEPARTMENT.key,
            nameAr = "الأدوية والمنتجات الطبية",
            nameEn = "Medications & Medical Products",
            description = "المستلزمات الطبية والأجهزة الصحية والمنتجات الدوائية.",
            slug = "medications-and-medicinal-products",
            parentId = null,
            sortOrder = 5
        )
    )

    fun initialBindings(): List<ProductTypeAttributeEntity> = listOf(
        ProductTypeAttributeEntity(
            id = "bind_led_color",
            productTypeNodeId = "cat_U24VqYORYXPSlfx8EZIpG",
            attributeId = "attr_color",
            role = AttributeRole.VARIANT.key,
            groupName = "خيارات الإضاءة",
            isRequired = true,
            isFilterable = true,
            isVariant = true,
            valueSetId = "vset_lighting_colors",
            allowedValuesCsv = "أصفر دافئ (3000K)|أبيض نهاري (6500K)|أبيض طبيعي (4000K)",
            sortOrder = 1
        ),
        ProductTypeAttributeEntity(
            id = "bind_led_socket_size",
            productTypeNodeId = "cat_U24VqYORYXPSlfx8EZIpG",
            attributeId = "attr_size",
            role = AttributeRole.VARIANT.key,
            groupName = "القاعدة والتركيب",
            isRequired = true,
            isFilterable = true,
            isVariant = true,
            valueSetId = "vset_standard_sizes",
            allowedValuesCsv = "قاعدة عريضة E27|قاعدة رفيعة E14|قاعدة سبوت GU10",
            sortOrder = 2
        ),
        ProductTypeAttributeEntity(
            id = "bind_led_power",
            productTypeNodeId = "cat_U24VqYORYXPSlfx8EZIpG",
            attributeId = "attr_power",
            role = AttributeRole.DESCRIPTIVE.key,
            groupName = "المواصفات الكهربائية",
            isRequired = true,
            isFilterable = true,
            isVariant = false,
            minValue = 3.0,
            maxValue = 50.0,
            unitId = "unit_watt",
            sortOrder = 3
        ),
        ProductTypeAttributeEntity(
            id = "bind_led_brand",
            productTypeNodeId = "cat_U24VqYORYXPSlfx8EZIpG",
            attributeId = "attr_brand",
            role = AttributeRole.IDENTITY.key,
            groupName = "الهوية",
            isRequired = true,
            isFilterable = true,
            isVariant = false,
            allowedValuesCsv = "فيليبس (Philips)|أوسرام (Osram)|الفنار (Alfanar)",
            sortOrder = 4
        ),
        ProductTypeAttributeEntity(
            id = "bind_led_waterproof",
            productTypeNodeId = "cat_U24VqYORYXPSlfx8EZIpG",
            attributeId = "attr_waterproof",
            role = AttributeRole.DESCRIPTIVE.key,
            groupName = "الحماية",
            isRequired = false,
            isFilterable = true,
            isVariant = false,
            sortOrder = 5
        ),
        ProductTypeAttributeEntity(
            id = "bind_pipe_pressure",
            productTypeNodeId = "cat_ppr_pipe_pt",
            attributeId = "attr_pressure",
            role = AttributeRole.DESCRIPTIVE.key,
            groupName = "المواصفات الهيدروليكية",
            isRequired = true,
            isFilterable = true,
            isVariant = false,
            minValue = 10.0,
            maxValue = 25.0,
            unitId = "unit_bar",
            sortOrder = 1
        )
    )
}
