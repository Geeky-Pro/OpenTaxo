package com.ycp.taxonomyplanner.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Scale
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ycp.taxonomyplanner.data.local.AttributeEntity
import com.ycp.taxonomyplanner.data.local.MeasurementDimensionEntity
import com.ycp.taxonomyplanner.domain.DATA_TYPE_DEFINITIONS
import com.ycp.taxonomyplanner.domain.DataType
import com.ycp.taxonomyplanner.domain.DomainRules
import com.ycp.taxonomyplanner.domain.FilterType
import com.ycp.taxonomyplanner.domain.RecordStatus
import com.ycp.taxonomyplanner.ui.CatalogUiState
import com.ycp.taxonomyplanner.ui.WorkspaceRoute
import com.ycp.taxonomyplanner.ui.theme.IbmPlexMonoFontFamily
import java.util.Locale

@Composable
fun DefinitionsHubScreen(
    uiState: CatalogUiState,
    onNavigate: (WorkspaceRoute) -> Unit
) {
    val centers = listOf(
        Triple(
            WorkspaceRoute.ATTRIBUTES_CENTER,
            "مركز الخصائص العامة",
            "المفتاح البرمجي، الأسماء، المرادفات (Aliases)، نوع البيانات، نمط الفلترة، والبُعد الفيزيائي (${uiState.attributes.size} خاصية)."
        ) to Icons.Default.Style,
        Triple(
            WorkspaceRoute.DATA_TYPES_CENTER,
            "مركز أنواع البيانات",
            "قواعد الإدخال وأنماط الفلترة المتوافقة لكل نوع أساسي محكوم (String, Number, Boolean, Enum)."
        ) to Icons.Default.Code,
        Triple(
            WorkspaceRoute.VALUE_SETS_CENTER,
            "مركز القيم (Value Sets)",
            "مجموعات القيم والقيم الفردية والمفاتيح والترجمات والترتيب والأرشفة (${uiState.valueSets.size} مجموعة)."
        ) to Icons.Default.CheckCircle,
        Triple(
            WorkspaceRoute.MEASUREMENTS_CENTER,
            "مركز الوحدات والأبعاد الفيزيائية",
            "الأبعاد الفيزيائية والوحدات الأساسية والرموز ومعاملات التحويل وإعادة التعيين (${uiState.units.size} وحدة)."
        ) to Icons.Default.Scale,
        Triple(
            WorkspaceRoute.UNIT_CONVERSIONS_CENTER,
            "قواعد التحويل وحاسبة الوحدات",
            "قواعد تحويل صريحة وحاسبة فورية للتحويل بين الوحدات المتوافقة (${uiState.conversionRules.size} قاعدة)."
        ) to Icons.Default.SwapHoriz
    )

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier
            .fillMaxSize()
            .testTag("definitions_hub_screen")
    ) {
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.padding(18.dp)
                ) {
                    Text(
                        text = "إدارة الكتالوج",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "التعريفات المركزية",
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Text(
                        text = "المعلومة تُعرّف مرة واحدة وتُستخدم في كل أنواع المنتجات. نفصل تعريف الخاصية ونوع بياناتها وقيمها ووحداتها عن إعدادات إسنادها إلى Product Type.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        items(centers) { (info, icon) ->
            val (route, title, subtitle) = info
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigate(route) }
                    .testTag("center_card_${route.name.lowercase()}")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Surface(
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                        contentColor = MaterialTheme.colorScheme.primary,
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            modifier = Modifier
                                .padding(12.dp)
                                .size(24.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                        contentDescription = "فتح",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun AttributesCenterScreen(
    uiState: CatalogUiState,
    onBackToHub: () -> Unit,
    onOpenDataTypes: () -> Unit,
    onSaveAttribute: (
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        dataType: DataType,
        filterType: FilterType,
        dimensionId: String?,
        aliases: List<String>,
        status: RecordStatus
    ) -> Unit
) {
    var editingAttr by remember { mutableStateOf<AttributeEntity?>(null) }
    var isCreating by remember { mutableStateOf(false) }
    val dimMap = remember(uiState.dimensions) { uiState.dimensions.associateBy { it.id } }
    val usageByAttr = remember(uiState.bindings) {
        uiState.bindings.groupBy { it.attributeId }.mapValues { it.value.size }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier
            .fillMaxSize()
            .testTag("attributes_center_screen")
    ) {
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBackToHub) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                    Column {
                        Text("مركز الخصائص العامة", style = MaterialTheme.typography.titleLarge)
                        Text(
                            text = "تعريف المفاتيح والمرادفات وتوافق أنواع البيانات والفلاتر",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedButton(onClick = onOpenDataTypes) {
                        Text("أنواع البيانات")
                    }
                    Button(
                        onClick = { isCreating = true },
                        enabled = uiState.isOwnerUnlocked,
                        modifier = Modifier.testTag("add_attribute_definition_button")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("خاصية جديدة")
                    }
                }
            }
        }

        items(uiState.attributes, key = { it.id }) { attr ->
            val dim = attr.measurementDimensionId?.let { dimMap[it] }
            val usageCount = usageByAttr[attr.id] ?: 0
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(enabled = uiState.isOwnerUnlocked) { editingAttr = attr }
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.padding(14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(
                                text = attr.nameAr + (attr.nameEn?.let { " · $it" } ?: ""),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "key: ${attr.key}",
                                fontFamily = IbmPlexMonoFontFamily,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Surface(
                            color = MaterialTheme.colorScheme.secondaryContainer,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "${attr.parsedDataType.labelAr} · ${attr.parsedFilterType.labelAr}",
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    if (attr.aliases.isNotEmpty()) {
                        Text(
                            text = "المرادفات (Aliases): ${attr.aliases.joinToString("، ")}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (dim != null) {
                            Text(
                                text = "البُعد الفيزيائي: ${dim.nameAr}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.tertiary
                            )
                        }
                        Text(
                            text = "مرتبطة بـ $usageCount Product Type",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    if (isCreating || editingAttr != null) {
        AttributeDefinitionDialog(
            initial = editingAttr,
            dimensions = uiState.dimensions.filter { it.parsedStatus == RecordStatus.ACTIVE },
            onDismiss = {
                isCreating = false
                editingAttr = null
            },
            onSave = { id, key, nameAr, nameEn, dt, ft, dimId, aliases, st ->
                onSaveAttribute(id, key, nameAr, nameEn, dt, ft, dimId, aliases, st)
                isCreating = false
                editingAttr = null
            }
        )
    }
}

@Composable
private fun AttributeDefinitionDialog(
    initial: AttributeEntity?,
    dimensions: List<MeasurementDimensionEntity>,
    onDismiss: () -> Unit,
    onSave: (
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        dataType: DataType,
        filterType: FilterType,
        dimensionId: String?,
        aliases: List<String>,
        status: RecordStatus
    ) -> Unit
) {
    var nameAr by remember { mutableStateOf(initial?.nameAr ?: "") }
    var nameEn by remember { mutableStateOf(initial?.nameEn ?: "") }
    var keyInput by remember { mutableStateOf(initial?.key ?: "") }
    var dataType by remember { mutableStateOf(initial?.parsedDataType ?: DataType.STRING) }
    val compatibleFilters = remember(dataType) { DomainRules.compatibleFiltersFor(dataType) }
    var filterType by remember(dataType) {
        val current = initial?.parsedFilterType
        mutableStateOf(
            if (current != null && current in compatibleFilters) current
            else compatibleFilters.first()
        )
    }
    var dimensionId by remember { mutableStateOf(initial?.measurementDimensionId) }
    var aliasesInput by remember { mutableStateOf(initial?.aliases?.joinToString("، ") ?: "") }
    var status by remember { mutableStateOf(initial?.parsedStatus ?: RecordStatus.ACTIVE) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "إضافة تعريف خاصية مركزية" else "تعديل تعريف الخاصية") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = nameAr,
                    onValueChange = { nameAr = it },
                    label = { Text("الاسم بالعربية *") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("attr_form_name_ar")
                )
                OutlinedTextField(
                    value = nameEn,
                    onValueChange = {
                        nameEn = it
                        if (initial == null && it.isNotBlank()) {
                            keyInput = DomainRules.normalizeKey(it)
                        }
                    },
                    label = { Text("الاسم بالإنجليزية") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = keyInput,
                    onValueChange = { keyInput = it },
                    label = { Text("المفتاح البرمجي (Key)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("نوع البيانات المحكوم (Data Type)", style = MaterialTheme.typography.labelLarge)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.horizontalScroll(rememberScrollState())
                ) {
                    DataType.entries.forEach { dt ->
                        FilterChip(
                            selected = dataType == dt,
                            onClick = { dataType = dt },
                            label = { Text("${dt.labelAr} (${dt.labelEn})") }
                        )
                    }
                }

                Text("نمط الفلترة المتوافق (Filter Type)", style = MaterialTheme.typography.labelLarge)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.horizontalScroll(rememberScrollState())
                ) {
                    compatibleFilters.forEach { ft ->
                        FilterChip(
                            selected = filterType == ft,
                            onClick = { filterType = ft },
                            label = { Text(ft.labelAr) }
                        )
                    }
                }

                if (dataType == DataType.NUMBER) {
                    Text("البُعد الفيزيائي (اختياري)", style = MaterialTheme.typography.labelLarge)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    ) {
                        dimensions.forEach { dim ->
                            FilterChip(
                                selected = dimensionId == dim.id,
                                onClick = {
                                    dimensionId = if (dimensionId == dim.id) null else dim.id
                                },
                                label = { Text(dim.nameAr) }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = aliasesInput,
                    onValueChange = { aliasesInput = it },
                    label = { Text("الأسماء البديلة والمرادفات (مفصولة بفاصلة)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val aliases = aliasesInput.split("،", ",", "|")
                        .map { it.trim() }
                        .filter { it.isNotEmpty() }
                    onSave(
                        initial?.id,
                        keyInput,
                        nameAr,
                        nameEn.ifBlank { null },
                        dataType,
                        filterType,
                        if (dataType == DataType.NUMBER) dimensionId else null,
                        aliases,
                        status
                    )
                },
                enabled = nameAr.isNotBlank(),
                modifier = Modifier.testTag("attr_form_submit_button")
            ) {
                Text("حفظ")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("إلغاء") }
        }
    )
}

@Composable
fun DataTypesCenterScreen(
    onBackToHub: () -> Unit,
    onOpenAttributes: () -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier
            .fillMaxSize()
            .testTag("data_types_center_screen")
    ) {
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBackToHub) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                    Column {
                        Text("مركز أنواع البيانات المحكومة", style = MaterialTheme.typography.titleLarge)
                        Text(
                            text = "الأنواع الأربعة الأساسية وقواعد توافق الفلاتر والأبعاد",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                OutlinedButton(onClick = onOpenAttributes) {
                    Text("مركز الخصائص")
                }
            }
        }

        items(DATA_TYPE_DEFINITIONS, key = { it.dataType.key }) { def ->
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(
                                text = def.dataType.labelAr,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${def.dataType.labelEn} · ${def.dataType.key}",
                                fontFamily = IbmPlexMonoFontFamily,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Surface(
                            color = if (def.supportsDimension)
                                MaterialTheme.colorScheme.tertiaryContainer
                            else MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(999.dp)
                        ) {
                            Text(
                                text = if (def.supportsDimension) "يدعم الأبعاد الفيزيائية" else "بلا بُعد فيزيائي",
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Text(def.description, style = MaterialTheme.typography.bodyMedium)
                    Text(
                        text = "قاعدة الإدخال: ${def.inputRule}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "الفلاتر المتوافقة: ${def.compatibleFilters.joinToString("، ") { it.labelAr }}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = def.valueSetRule,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun ValueSetsCenterScreen(
    uiState: CatalogUiState,
    onBackToHub: () -> Unit,
    onSaveValueSet: (
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        attributeId: String?,
        status: RecordStatus
    ) -> Unit,
    onSaveAttributeValue: (
        id: String?,
        valueSetId: String,
        valueKeyInput: String,
        labelAr: String,
        labelEn: String?,
        rawValue: String?,
        sortOrder: Int,
        status: RecordStatus
    ) -> Unit
) {
    var selectedSetId by remember(uiState.valueSets) {
        mutableStateOf(uiState.valueSets.firstOrNull()?.id)
    }
    var showCreateSetDialog by remember { mutableStateOf(false) }
    var showAddValueDialog by remember { mutableStateOf(false) }

    val selectedSet = uiState.valueSets.find { it.id == selectedSetId } ?: uiState.valueSets.firstOrNull()
    val valuesForSelected = remember(selectedSet, uiState.attributeValues) {
        uiState.attributeValues.filter { it.valueSetId == selectedSet?.id }
    }
    val enumAttributes = remember(uiState.attributes) {
        uiState.attributes.filter { it.parsedDataType == DataType.ENUM }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier
            .fillMaxSize()
            .testTag("value_sets_center_screen")
    ) {
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBackToHub) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                    Column {
                        Text("مركز القيم (Value Sets)", style = MaterialTheme.typography.titleLarge)
                        Text(
                            text = "إدارة مجموعات القيم للخصائص من نوع قائمة محددة (Enum)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Button(
                    onClick = { showCreateSetDialog = true },
                    enabled = uiState.isOwnerUnlocked,
                    modifier = Modifier.testTag("add_value_set_button")
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("مجموعة جديدة")
                }
            }
        }

        item {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
            ) {
                uiState.valueSets.forEach { vs ->
                    FilterChip(
                        selected = selectedSet?.id == vs.id,
                        onClick = { selectedSetId = vs.id },
                        label = { Text(vs.nameAr) }
                    )
                }
            }
        }

        if (selectedSet != null) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column {
                                Text(
                                    text = selectedSet.nameAr,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "key: ${selectedSet.key} · ${valuesForSelected.size} خيارات",
                                    fontFamily = IbmPlexMonoFontFamily,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Button(
                                onClick = { showAddValueDialog = true },
                                enabled = uiState.isOwnerUnlocked,
                                modifier = Modifier.testTag("add_attribute_value_button")
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("إضافة قيمة")
                            }
                        }

                        HorizontalDivider()

                        valuesForSelected.forEach { valItem ->
                            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp)
                                ) {
                                    Column {
                                        Text(
                                            text = valItem.labelAr + (valItem.labelEn?.let { " · $it" } ?: ""),
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                        Text(
                                            text = "key: ${valItem.valueKey}" + (valItem.rawValue?.let { " · raw: $it" } ?: ""),
                                            fontFamily = IbmPlexMonoFontFamily,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Text(
                                        text = "#${valItem.sortOrder}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateSetDialog) {
        var nameAr by remember { mutableStateOf("") }
        var nameEn by remember { mutableStateOf("") }
        var selectedAttrId by remember { mutableStateOf(enumAttributes.firstOrNull()?.id) }
        AlertDialog(
            onDismissRequest = { showCreateSetDialog = false },
            title = { Text("إنشاء مجموعة قيم مركزية") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nameAr,
                        onValueChange = { nameAr = it },
                        label = { Text("اسم المجموعة بالعربية *") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = nameEn,
                        onValueChange = { nameEn = it },
                        label = { Text("الاسم بالإنجليزية") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("ربط بخاصية Enum (اختياري)", style = MaterialTheme.typography.labelLarge)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    ) {
                        enumAttributes.forEach { attr ->
                            FilterChip(
                                selected = selectedAttrId == attr.id,
                                onClick = { selectedAttrId = attr.id },
                                label = { Text(attr.nameAr) }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSaveValueSet(null, nameEn, nameAr, nameEn.ifBlank { null }, selectedAttrId, RecordStatus.ACTIVE)
                        showCreateSetDialog = false
                    },
                    enabled = nameAr.isNotBlank()
                ) { Text("حفظ") }
            },
            dismissButton = {
                TextButton(onClick = { showCreateSetDialog = false }) { Text("إلغاء") }
            }
        )
    }

    if (showAddValueDialog && selectedSet != null) {
        var labelAr by remember { mutableStateOf("") }
        var labelEn by remember { mutableStateOf("") }
        var rawValue by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showAddValueDialog = false },
            title = { Text("إضافة قيمة إلى '${selectedSet.nameAr}'") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = labelAr,
                        onValueChange = { labelAr = it },
                        label = { Text("التسمية العربية *") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = labelEn,
                        onValueChange = { labelEn = it },
                        label = { Text("التسمية الإنجليزية") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = rawValue,
                        onValueChange = { rawValue = it },
                        label = { Text("القيمة الخام / كود اللون (مثل #FCD34D أو E27)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSaveAttributeValue(
                            null,
                            selectedSet.id,
                            labelEn,
                            labelAr,
                            labelEn.ifBlank { null },
                            rawValue.ifBlank { null },
                            valuesForSelected.size + 1,
                            RecordStatus.ACTIVE
                        )
                        showAddValueDialog = false
                    },
                    enabled = labelAr.isNotBlank()
                ) { Text("إضافة") }
            },
            dismissButton = {
                TextButton(onClick = { showAddValueDialog = false }) { Text("إلغاء") }
            }
        )
    }
}

@Composable
fun MeasurementsAndConversionsScreen(
    uiState: CatalogUiState,
    initialTabIsConversions: Boolean,
    onBackToHub: () -> Unit,
    onSaveDimension: (
        id: String?,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        baseUnitKey: String?,
        baseUnitNameAr: String?,
        baseUnitSymbol: String?
    ) -> Unit,
    onSaveUnit: (
        id: String?,
        dimensionId: String,
        keyInput: String,
        nameAr: String,
        nameEn: String?,
        symbol: String?,
        multiplier: Double,
        offset: Double,
        status: RecordStatus
    ) -> Unit,
    onRebaseUnit: (String) -> Unit,
    onSaveConversionRule: (String, String) -> Unit,
    onDeleteConversionRule: (String) -> Unit
) {
    var activeTab by remember(initialTabIsConversions) {
        mutableStateOf(if (initialTabIsConversions) 1 else 0)
    }
    var selectedDimId by remember(uiState.dimensions) {
        mutableStateOf(uiState.dimensions.firstOrNull()?.id)
    }
    var showAddDimensionDialog by remember { mutableStateOf(false) }
    var showAddUnitDialog by remember { mutableStateOf(false) }

    val selectedDimension = uiState.dimensions.find { it.id == selectedDimId }
        ?: uiState.dimensions.firstOrNull()
    val unitsForDim = remember(selectedDimension, uiState.units) {
        uiState.units.filter { it.dimensionId == selectedDimension?.id }
    }

    // Calculator state
    var calcInputText by remember { mutableStateOf("1") }
    var calcSourceUnitId by remember(unitsForDim) {
        mutableStateOf(unitsForDim.firstOrNull()?.id)
    }
    var calcTargetUnitId by remember(unitsForDim) {
        mutableStateOf(unitsForDim.getOrNull(1)?.id ?: unitsForDim.firstOrNull()?.id)
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier
            .fillMaxSize()
            .testTag("measurements_and_conversions_screen")
    ) {
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBackToHub) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                    Column {
                        Text(
                            text = if (activeTab == 0) "مركز الوحدات والأبعاد الفيزيائية" else "قواعد التحويل وحاسبة الوحدات",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = "معادلة الوحدة الأساسية: base = value × multiplier + offset",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    label = { Text("الأبعاد والوحدات (${uiState.units.size})") },
                    modifier = Modifier.testTag("tab_dimensions_units")
                )
                FilterChip(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    label = { Text("حاسبة وقواعد التحويل (${uiState.conversionRules.size})") },
                    modifier = Modifier.testTag("tab_conversions_calculator")
                )
            }
        }

        item {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
            ) {
                uiState.dimensions.forEach { dim ->
                    FilterChip(
                        selected = selectedDimension?.id == dim.id,
                        onClick = { selectedDimId = dim.id },
                        label = { Text(dim.nameAr) }
                    )
                }
                if (activeTab == 0 && uiState.isOwnerUnlocked) {
                    OutlinedButton(onClick = { showAddDimensionDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("بُعد جديد")
                    }
                }
            }
        }

        if (activeTab == 0 && selectedDimension != null) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column {
                                Text(
                                    text = "وحدات البُعد: ${selectedDimension.nameAr}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "تغيير الوحدة الأساسية (Rebase) يعيد حساب جميع الوحدات وقواعد التحويل ذرياً.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (uiState.isOwnerUnlocked) {
                                Button(
                                    onClick = { showAddUnitDialog = true },
                                    modifier = Modifier.testTag("add_measurement_unit_button")
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("إضافة وحدة")
                                }
                            }
                        }

                        unitsForDim.forEach { unit ->
                            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp)
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "${unit.nameAr} (${unit.symbol.orEmpty()})",
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                            if (unit.isBase) {
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Surface(
                                                    color = MaterialTheme.colorScheme.tertiaryContainer,
                                                    contentColor = MaterialTheme.colorScheme.onTertiaryContainer,
                                                    shape = RoundedCornerShape(6.dp)
                                                ) {
                                                    Text(
                                                        text = "الوحدة الأساسية (Base)",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                                    )
                                                }
                                            }
                                        }
                                        Text(
                                            text = "multiplier = ${unit.toBaseMultiplier} · offset = ${unit.toBaseOffset}",
                                            fontFamily = IbmPlexMonoFontFamily,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }

                                    if (!unit.isBase && uiState.isOwnerUnlocked) {
                                        TextButton(
                                            onClick = { onRebaseUnit(unit.id) },
                                            modifier = Modifier.testTag("rebase_unit_${unit.id}")
                                        ) {
                                            Text("تعيين كوحدة أساسية (Rebase)")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else if (activeTab == 1 && selectedDimension != null) {
            // Interactive Conversion Calculator Card
            item {
                val srcUnit = unitsForDim.find { it.id == calcSourceUnitId } ?: unitsForDim.firstOrNull()
                val dstUnit = unitsForDim.find { it.id == calcTargetUnitId }
                    ?: unitsForDim.getOrNull(1)
                    ?: unitsForDim.firstOrNull()
                val numericVal = calcInputText.toDoubleOrNull() ?: 0.0
                val convertedResult = remember(numericVal, srcUnit, dstUnit) {
                    if (srcUnit != null && dstUnit != null) {
                        runCatching {
                            DomainRules.convertValue(
                                numericVal,
                                srcUnit.dimensionId,
                                srcUnit.toBaseMultiplier,
                                srcUnit.toBaseOffset,
                                dstUnit.dimensionId,
                                dstUnit.toBaseMultiplier,
                                dstUnit.toBaseOffset
                            )
                        }.getOrNull()
                    } else null
                }

                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Calculate,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "حاسبة التحويل الفورية (${selectedDimension.nameAr})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        OutlinedTextField(
                            value = calcInputText,
                            onValueChange = { calcInputText = it },
                            label = { Text("القيمة المراد تحويلها") },
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("conversion_calculator_input")
                        )

                        Text("من الوحدة (Source):", style = MaterialTheme.typography.labelMedium)
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.horizontalScroll(rememberScrollState())
                        ) {
                            unitsForDim.forEach { u ->
                                FilterChip(
                                    selected = srcUnit?.id == u.id,
                                    onClick = { calcSourceUnitId = u.id },
                                    label = { Text("${u.nameAr} (${u.symbol.orEmpty()})") }
                                )
                            }
                        }

                        Text("إلى الوحدة (Target):", style = MaterialTheme.typography.labelMedium)
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.horizontalScroll(rememberScrollState())
                        ) {
                            unitsForDim.forEach { u ->
                                FilterChip(
                                    selected = dstUnit?.id == u.id,
                                    onClick = { calcTargetUnitId = u.id },
                                    label = { Text("${u.nameAr} (${u.symbol.orEmpty()})") }
                                )
                            }
                        }

                        if (srcUnit != null && dstUnit != null && convertedResult != null) {
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.padding(14.dp)
                                ) {
                                    Text(
                                        text = String.format(
                                            Locale.US,
                                            "%.4f %s = %.4f %s",
                                            numericVal,
                                            srcUnit.symbol ?: srcUnit.nameAr,
                                            convertedResult,
                                            dstUnit.symbol ?: dstUnit.nameAr
                                        ),
                                        fontFamily = IbmPlexMonoFontFamily,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (srcUnit.id != dstUnit.id && uiState.isOwnerUnlocked) {
                                        Button(
                                            onClick = { onSaveConversionRule(srcUnit.id, dstUnit.id) },
                                            modifier = Modifier.testTag("save_conversion_rule_button")
                                        ) {
                                            Text("حفظ كقاعدة")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Text(
                    text = "قواعد التحويل الصريحة المحفوظة",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            val unitMap = uiState.units.associateBy { it.id }
            items(uiState.conversionRules, key = { it.id }) { rule ->
                val src = unitMap[rule.sourceUnitId]
                val dst = unitMap[rule.targetUnitId]
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp)
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${src?.nameAr ?: rule.sourceUnitId} ← ${dst?.nameAr ?: rule.targetUnitId}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "target = source × ${rule.multiplier} + ${rule.offsetValue}",
                                fontFamily = IbmPlexMonoFontFamily,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        if (uiState.isOwnerUnlocked) {
                            IconButton(onClick = { onDeleteConversionRule(rule.id) }) {
                                Icon(
                                    imageVector = Icons.Default.DeleteOutline,
                                    contentDescription = "حذف القاعدة",
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDimensionDialog) {
        var nameAr by remember { mutableStateOf("") }
        var nameEn by remember { mutableStateOf("") }
        var baseUnitNameAr by remember { mutableStateOf("") }
        var baseUnitSymbol by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showAddDimensionDialog = false },
            title = { Text("إضافة بُعد فيزيائي جديد مع وحدته الأساسية") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nameAr,
                        onValueChange = { nameAr = it },
                        label = { Text("اسم البُعد بالعربية (مثل: الحجم) *") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = nameEn,
                        onValueChange = { nameEn = it },
                        label = { Text("اسم البُعد بالإنجليزية (مثل: Volume)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = baseUnitNameAr,
                        onValueChange = { baseUnitNameAr = it },
                        label = { Text("اسم الوحدة الأساسية (مثل: لتر) *") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = baseUnitSymbol,
                        onValueChange = { baseUnitSymbol = it },
                        label = { Text("رمز الوحدة الأساسية (مثل: L)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSaveDimension(
                            null, nameEn, nameAr, nameEn.ifBlank { null },
                            baseUnitSymbol.ifBlank { baseUnitNameAr }, baseUnitNameAr, baseUnitSymbol
                        )
                        showAddDimensionDialog = false
                    },
                    enabled = nameAr.isNotBlank() && baseUnitNameAr.isNotBlank()
                ) { Text("حفظ") }
            },
            dismissButton = {
                TextButton(onClick = { showAddDimensionDialog = false }) { Text("إلغاء") }
            }
        )
    }

    if (showAddUnitDialog && selectedDimension != null) {
        var nameAr by remember { mutableStateOf("") }
        var nameEn by remember { mutableStateOf("") }
        var symbol by remember { mutableStateOf("") }
        var multiplierText by remember { mutableStateOf("1.0") }
        var offsetText by remember { mutableStateOf("0.0") }
        AlertDialog(
            onDismissRequest = { showAddUnitDialog = false },
            title = { Text("إضافة وحدة قياس في '${selectedDimension.nameAr}'") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nameAr,
                        onValueChange = { nameAr = it },
                        label = { Text("اسم الوحدة بالعربية *") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = nameEn,
                        onValueChange = { nameEn = it },
                        label = { Text("الاسم بالإنجليزية") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = symbol,
                        onValueChange = { symbol = it },
                        label = { Text("الرمز (Symbol)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = multiplierText,
                        onValueChange = { multiplierText = it },
                        label = { Text("معامل التحويل للأساس (Multiplier)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = offsetText,
                        onValueChange = { offsetText = it },
                        label = { Text("الإزاحة للأساس (Offset)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onSaveUnit(
                            null,
                            selectedDimension.id,
                            nameEn.ifBlank { symbol },
                            nameAr,
                            nameEn.ifBlank { null },
                            symbol.ifBlank { null },
                            multiplierText.toDoubleOrNull() ?: 1.0,
                            offsetText.toDoubleOrNull() ?: 0.0,
                            RecordStatus.ACTIVE
                        )
                        showAddUnitDialog = false
                    },
                    enabled = nameAr.isNotBlank()
                ) { Text("حفظ") }
            },
            dismissButton = {
                TextButton(onClick = { showAddUnitDialog = false }) { Text("إلغاء") }
            }
        )
    }
}
