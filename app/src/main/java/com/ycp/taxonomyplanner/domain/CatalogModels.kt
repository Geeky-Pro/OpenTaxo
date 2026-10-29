package com.ycp.taxonomyplanner.domain

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.math.abs

@Serializable
enum class NodeType(val key: String, val labelAr: String, val labelEn: String) {
    DEPARTMENT("department", "قسم رئيسي (Department)", "Department"),
    CATEGORY("category", "تصنيف (Category)", "Category"),
    SUBCATEGORY("subcategory", "تصنيف فرعي (Subcategory)", "Subcategory"),
    PRODUCT_TYPE("product_type", "نوع منتج (Product Type)", "Product Type");

    companion object {
        fun fromKey(key: String?): NodeType =
            entries.find { it.key.equals(key?.trim(), ignoreCase = true) } ?: CATEGORY
    }
}

@Serializable
enum class RecordStatus(val key: String, val labelAr: String) {
    ACTIVE("active", "نشط"),
    ARCHIVED("archived", "مؤرشف");

    companion object {
        fun fromKey(key: String?): RecordStatus =
            if (key == "archived") ARCHIVED else ACTIVE
    }
}

@Serializable
enum class DataType(val key: String, val labelAr: String, val labelEn: String) {
    STRING("string", "نص", "String"),
    NUMBER("number", "رقم", "Number"),
    BOOLEAN("boolean", "منطقي", "Boolean"),
    ENUM("enum", "قائمة محددة", "Enum");

    companion object {
        fun fromKey(key: String?): DataType =
            entries.find { it.key.equals(key?.trim(), ignoreCase = true) } ?: STRING
    }
}

@Serializable
enum class FilterType(val key: String, val labelAr: String) {
    RANGE("range", "نطاق رقمي"),
    CHECKBOX("checkbox", "مربعات اختيار"),
    SELECT("select", "قائمة منسدلة"),
    TOGGLE("toggle", "مفتاح نعم/لا"),
    COLOR_SWATCH("color_swatch", "عينات ألوان"),
    BUTTON_GROUP("button_group", "مجموعة أزرار");

    companion object {
        fun fromKey(key: String?): FilterType =
            entries.find { it.key.equals(key?.trim(), ignoreCase = true) } ?: SELECT
    }
}

@Serializable
enum class AttributeRole(val key: String, val labelAr: String) {
    IDENTITY("identity", "هوية المنتج"),
    VARIANT("variant", "محور متغيرات"),
    DESCRIPTIVE("descriptive", "مواصفة وصفية"),
    COMMERCIAL("commercial", "بيانات تجارية");

    companion object {
        fun fromKey(key: String?): AttributeRole =
            entries.find { it.key.equals(key?.trim(), ignoreCase = true) } ?: DESCRIPTIVE
    }
}

data class DataTypeDefinitionInfo(
    val dataType: DataType,
    val description: String,
    val inputRule: String,
    val supportsDimension: Boolean,
    val valueSetRule: String,
    val compatibleFilters: List<FilterType>
)

val DATA_TYPE_DEFINITIONS: List<DataTypeDefinitionInfo> = listOf(
    DataTypeDefinitionInfo(
        dataType = DataType.STRING,
        description = "قيمة نصية مثل اسم الموديل أو المادة أو بلد المنشأ.",
        inputRule = "حقل نصي؛ تُحفظ القيمة كنص ولا تُجرى عليها عمليات حسابية.",
        supportsDimension = false,
        valueSetRule = "يمكن استخدام الخيارات النصية عبر الفلاتر المتوافقة؛ القيم المركزية تأتي في مركز القيم.",
        compatibleFilters = listOf(FilterType.SELECT, FilterType.CHECKBOX, FilterType.BUTTON_GROUP)
    ),
    DataTypeDefinitionInfo(
        dataType = DataType.NUMBER,
        description = "قيمة عددية قابلة للمقارنة والحساب مثل القدرة الكهربائية أو الوزن.",
        inputRule = "قيمة رقمية؛ حدود الحد الأدنى والأعلى والوحدة تُضبط عند إسناد الخاصية إلى Product Type.",
        supportsDimension = true,
        valueSetRule = "لا يحتاج مجموعة قيم؛ الفلترة الافتراضية نطاق رقمي.",
        compatibleFilters = listOf(FilterType.RANGE)
    ),
    DataTypeDefinitionInfo(
        dataType = DataType.BOOLEAN,
        description = "قيمة ثنائية: صحيح/خطأ أو نعم/لا مثل مقاوم للماء.",
        inputRule = "قيمة منطقية حقيقية وليست نصاً مثل 'نعم' أو 'لا'.",
        supportsDimension = false,
        valueSetRule = "لا يحتاج مجموعة قيم.",
        compatibleFilters = listOf(FilterType.TOGGLE, FilterType.CHECKBOX)
    ),
    DataTypeDefinitionInfo(
        dataType = DataType.ENUM,
        description = "قيمة تختار من مجموعة خيارات معرفة مركزياً في مركز القيم.",
        inputRule = "تُحفظ قيمة مفتاح ثابت، بينما تظهر التسميات العربية والإنجليزية للمستخدم.",
        supportsDimension = false,
        valueSetRule = "تُعرّف خياراته في مركز القيم، ثم تُختار مجموعة متوافقة عند إسناد السمة إلى Product Type.",
        compatibleFilters = listOf(
            FilterType.SELECT,
            FilterType.CHECKBOX,
            FilterType.BUTTON_GROUP,
            FilterType.COLOR_SWATCH
        )
    )
)

object DomainRules {

    fun compatibleFiltersFor(dataType: DataType): List<FilterType> =
        DATA_TYPE_DEFINITIONS.first { it.dataType == dataType }.compatibleFilters

    fun isCompatibleFilter(dataType: DataType, filterType: FilterType): Boolean =
        compatibleFiltersFor(dataType).contains(filterType)

    /**
     * Enforces canonical taxonomy hierarchy:
     * Root (null parent) -> DEPARTMENT
     * DEPARTMENT -> CATEGORY
     * CATEGORY -> SUBCATEGORY or PRODUCT_TYPE
     * SUBCATEGORY -> PRODUCT_TYPE
     * PRODUCT_TYPE -> leaf (cannot have children)
     */
    fun allowedChildTypesForParent(parentType: NodeType?): List<NodeType> = when (parentType) {
        null -> listOf(NodeType.DEPARTMENT)
        NodeType.DEPARTMENT -> listOf(NodeType.CATEGORY)
        NodeType.CATEGORY -> listOf(NodeType.SUBCATEGORY, NodeType.PRODUCT_TYPE)
        NodeType.SUBCATEGORY -> listOf(NodeType.PRODUCT_TYPE)
        NodeType.PRODUCT_TYPE -> emptyList()
    }

    fun allowedParentTypesForNode(nodeType: NodeType): List<NodeType?> = when (nodeType) {
        NodeType.DEPARTMENT -> listOf(null)
        NodeType.CATEGORY -> listOf(NodeType.DEPARTMENT)
        NodeType.SUBCATEGORY -> listOf(NodeType.CATEGORY)
        NodeType.PRODUCT_TYPE -> listOf(NodeType.CATEGORY, NodeType.SUBCATEGORY)
    }

    fun validatePlacement(nodeType: NodeType, parentType: NodeType?): String? {
        if (parentType == null && nodeType != NodeType.DEPARTMENT) {
            return "العقد الجذرية في المستوى الأول يجب أن تكون من نوع قسم رئيسي (Department)."
        }
        if (parentType != null && nodeType == NodeType.DEPARTMENT) {
            return "القسم الرئيسي (Department) يجب أن يكون في الجذر ولا يمكن وضعه تحت عقدة أخرى."
        }
        if (parentType == NodeType.PRODUCT_TYPE) {
            return "نوع المنتج (Product Type) هو عقدة طرفية (Leaf) ولا يمكن إضافة تصنيفات فرعية تحته."
        }
        val allowed = allowedChildTypesForParent(parentType)
        if (nodeType !in allowed) {
            return "لا يُسمح بوضع ${nodeType.labelAr} مباشرة تحت ${parentType?.labelAr ?: "الجذر"}."
        }
        return null
    }

    private val arabicTransliteration = mapOf(
        'ا' to "a", 'أ' to "a", 'إ' to "i", 'آ' to "aa", 'ب' to "b", 'ت' to "t", 'ث' to "th",
        'ج' to "j", 'ح' to "h", 'خ' to "kh", 'د' to "d", 'ذ' to "dh", 'ر' to "r", 'ز' to "z",
        'س' to "s", 'ش' to "sh", 'ص' to "s", 'ض' to "d", 'ط' to "t", 'ظ' to "z", 'ع' to "a",
        'غ' to "gh", 'ف' to "f", 'ق' to "q", 'ك' to "k", 'ل' to "l", 'م' to "m", 'ن' to "n",
        'ه' to "h", 'ة' to "h", 'و' to "w", 'ؤ' to "w", 'ي' to "y", 'ى' to "a", 'ئ' to "y",
        'ء' to ""
    )

    fun normalizeSlug(input: String): String {
        val sb = StringBuilder()
        for (ch in input.trim().lowercase()) {
            when {
                ch in 'a'..'z' || ch in '0'..'9' -> sb.append(ch)
                arabicTransliteration.containsKey(ch) -> sb.append(arabicTransliteration[ch])
                ch == ' ' || ch == '-' || ch == '_' || ch == '/' -> sb.append('-')
            }
        }
        val collapsed = sb.toString().replace(Regex("-+"), "-").trim('-')
        return collapsed.ifEmpty { "node-${System.currentTimeMillis() % 10000}" }
    }

    fun normalizeKey(input: String): String {
        val raw = normalizeSlug(input).replace('-', '_')
        val prefixed = if (raw.firstOrNull()?.isLetter() == true) raw else "attr_$raw"
        return prefixed.take(62)
    }

    fun calculateDirectConversion(
        sourceDimensionId: String,
        sourceMultiplier: Double,
        sourceOffset: Double,
        targetDimensionId: String,
        targetMultiplier: Double,
        targetOffset: Double
    ): Pair<Double, Double> {
        require(sourceDimensionId == targetDimensionId) {
            "لا يمكن التحويل بين وحدات تنتمي لأبعاد فيزيائية مختلفة."
        }
        require(
            sourceMultiplier.isFinite() && sourceMultiplier > 0.0 &&
                targetMultiplier.isFinite() && targetMultiplier > 0.0 &&
                sourceOffset.isFinite() && targetOffset.isFinite()
        ) {
            "معاملات التحويل للوحدات غير صالحة."
        }
        val multiplier = sourceMultiplier / targetMultiplier
        val offset = (sourceOffset - targetOffset) / targetMultiplier
        return multiplier to offset
    }

    fun convertValue(
        value: Double,
        sourceDimensionId: String,
        sourceMultiplier: Double,
        sourceOffset: Double,
        targetDimensionId: String,
        targetMultiplier: Double,
        targetOffset: Double
    ): Double {
        val (m, o) = calculateDirectConversion(
            sourceDimensionId, sourceMultiplier, sourceOffset,
            targetDimensionId, targetMultiplier, targetOffset
        )
        return value * m + o
    }

    fun isFormulaConsistentWithCanonical(
        sourceMultiplier: Double,
        sourceOffset: Double,
        targetMultiplier: Double,
        targetOffset: Double,
        ruleMultiplier: Double,
        ruleOffset: Double
    ): Boolean {
        val expectedMultiplier = sourceMultiplier / targetMultiplier
        val expectedOffset = (sourceOffset - targetOffset) / targetMultiplier
        return abs(ruleMultiplier - expectedMultiplier) < 1e-6 &&
            abs(ruleOffset - expectedOffset) < 1e-6
    }
}

@Serializable
data class EnrichedBreadcrumb(
    val id: String,
    val name_ar: String,
    val slug: String
)

@Serializable
data class EnrichedAttributeExport(
    val attribute_id: String,
    val key: String,
    val name_ar: String,
    val name_en: String? = null,
    val data_type: String,
    val filter_type: String,
    val unit: String? = null,
    val role: String,
    val group: String? = null,
    val is_required: Boolean,
    val is_filterable: Boolean,
    val is_variant: Boolean,
    val min_value: Double? = null,
    val max_value: Double? = null,
    val value_set_key: String? = null,
    val allowed_values: List<String> = emptyList()
)

@Serializable
data class EnrichedCategoryExport(
    val id: String,
    val name_ar: String,
    val name_en: String? = null,
    val description: String? = null,
    val slug: String,
    val node_type: String,
    val status: String,
    val parent_id: String? = null,
    val path: String,
    val depth: Int,
    val breadcrumbs: List<EnrichedBreadcrumb>,
    val image: String? = null,
    val attributes: List<EnrichedAttributeExport>
)

val PrettyExportJson = Json {
    prettyPrint = true
    encodeDefaults = true
}

fun encodeEnrichedCatalog(items: List<EnrichedCategoryExport>): String =
    PrettyExportJson.encodeToString(items)
