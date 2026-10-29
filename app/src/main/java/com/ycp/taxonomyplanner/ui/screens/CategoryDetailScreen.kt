package com.ycp.taxonomyplanner.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
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
import com.ycp.taxonomyplanner.data.local.MeasurementUnitEntity
import com.ycp.taxonomyplanner.data.local.ProductTypeAttributeEntity
import com.ycp.taxonomyplanner.data.local.ValueSetEntity
import com.ycp.taxonomyplanner.domain.AttributeRole
import com.ycp.taxonomyplanner.domain.DataType
import com.ycp.taxonomyplanner.domain.NodeType
import com.ycp.taxonomyplanner.domain.RecordStatus
import com.ycp.taxonomyplanner.ui.CatalogUiState
import com.ycp.taxonomyplanner.ui.components.NodeTypeBadge

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CategoryDetailScreen(
    uiState: CatalogUiState,
    categoryId: String,
    getFullPathAr: (String) -> String,
    getDisqualifiedParentIds: (String, NodeType) -> Set<String>,
    onNavigateBack: () -> Unit,
    onOpenInStorefront: (String) -> Unit,
    onSaveNode: (
        id: String,
        nameAr: String,
        nameEn: String?,
        description: String,
        slug: String,
        nodeType: NodeType,
        parentId: String?,
        imagePath: String?,
        sortOrder: Int,
        status: RecordStatus
    ) -> Unit,
    onSaveBinding: (
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
    ) -> Unit,
    onRemoveBinding: (String) -> Unit
) {
    val node = uiState.nodes.find { it.id == categoryId }
    if (node == null) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text("التصنيف غير موجود.")
            Button(onClick = onNavigateBack) { Text("عودة") }
        }
        return
    }

    var nameAr by remember(node.id) { mutableStateOf(node.nameAr) }
    var nameEn by remember(node.id) { mutableStateOf(node.nameEn ?: "") }
    var description by remember(node.id) { mutableStateOf(node.description) }
    var slug by remember(node.id) { mutableStateOf(node.slug) }
    var nodeType by remember(node.id) { mutableStateOf(node.parsedNodeType) }
    var parentId by remember(node.id) { mutableStateOf(node.parentId) }
    var imagePath by remember(node.id) { mutableStateOf(node.imagePath) }
    var sortOrderText by remember(node.id) { mutableStateOf(node.sortOrder.toString()) }
    var status by remember(node.id) { mutableStateOf(node.parsedStatus) }
    var parentDropdownExpanded by remember { mutableStateOf(false) }

    var editingBinding by remember { mutableStateOf<ProductTypeAttributeEntity?>(null) }
    var isAddingBinding by remember { mutableStateOf(false) }

    // Zero-permission Android Photo Picker per Google Play Policy
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            imagePath = uri.toString()
        }
    }

    val disqualifiedParents = remember(node.id, nodeType, uiState.nodes) {
        getDisqualifiedParentIds(node.id, nodeType)
    }
    val validParents = remember(uiState.nodes, disqualifiedParents) {
        uiState.nodes.filter { it.id !in disqualifiedParents }
    }
    val nodeBindings = remember(uiState.bindings, node.id) {
        uiState.bindings.filter { it.productTypeNodeId == node.id }
    }
    val attrMap = remember(uiState.attributes) {
        uiState.attributes.associateBy { it.id }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier
            .fillMaxSize()
            .testTag("category_detail_screen")
    ) {
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onNavigateBack,
                        modifier = Modifier.testTag("detail_back_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                    Column {
                        Text(
                            text = node.nameAr,
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = getFullPathAr(node.id),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                OutlinedButton(onClick = { onOpenInStorefront(node.id) }) {
                    Icon(Icons.Default.Storefront, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("معاينة المتجر")
                }
            }
        }

        // Metadata & Image Editor Card
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "البيانات الأساسية والهوية الهرمية",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        NodeTypeBadge(nodeType)
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        CategoryThumbnail(
                            imagePath = imagePath,
                            nodeType = nodeType,
                            modifier = Modifier.size(72.dp)
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            OutlinedButton(
                                onClick = {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                },
                                enabled = uiState.isOwnerUnlocked,
                                modifier = Modifier.testTag("pick_category_image_button")
                            ) {
                                Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("اختيار صورة التصنيف (Photo Picker)")
                            }
                            Text(
                                text = "يدعم صور PNG / JPEG / WebP بدون طلب صلاحيات تخزين واسعة.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    OutlinedTextField(
                        value = nameAr,
                        onValueChange = { nameAr = it },
                        label = { Text("الاسم بالعربية *") },
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

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = slug,
                            onValueChange = { slug = it },
                            label = { Text("الرابط (Slug)") },
                            singleLine = true,
                            modifier = Modifier.weight(1.4f)
                        )
                        OutlinedTextField(
                            value = sortOrderText,
                            onValueChange = { sortOrderText = it },
                            label = { Text("الترتيب") },
                            singleLine = true,
                            modifier = Modifier.weight(0.6f)
                        )
                    }

                    Text("نوع العقدة", style = MaterialTheme.typography.labelLarge)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                    ) {
                        NodeType.entries.forEach { nt ->
                            FilterChip(
                                selected = nodeType == nt,
                                onClick = {
                                    nodeType = nt
                                    if (nt == NodeType.DEPARTMENT) parentId = null
                                },
                                label = { Text(nt.labelAr) }
                            )
                        }
                    }

                    if (nodeType != NodeType.DEPARTMENT) {
                        ExposedDropdownMenuBox(
                            expanded = parentDropdownExpanded,
                            onExpandedChange = { parentDropdownExpanded = !parentDropdownExpanded }
                        ) {
                            val currentParent = uiState.nodes.find { it.id == parentId }
                            OutlinedTextField(
                                value = currentParent?.nameAr ?: "بدون أب (جذر)",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("التصنيف الأب") },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = parentDropdownExpanded)
                                },
                                modifier = Modifier
                                    .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                                    .fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = parentDropdownExpanded,
                                onDismissRequest = { parentDropdownExpanded = false }
                            ) {
                                validParents.forEach { candidate ->
                                    DropdownMenuItem(
                                        text = { Text("${candidate.nameAr} (${candidate.parsedNodeType.labelAr})") },
                                        onClick = {
                                            parentId = candidate.id
                                            parentDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("وصف التصنيف / نوع المنتج") },
                        maxLines = 4,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            RecordStatus.entries.forEach { st ->
                                FilterChip(
                                    selected = status == st,
                                    onClick = { status = st },
                                    label = { Text("الحالة: ${st.labelAr}") }
                                )
                            }
                        }
                        Button(
                            onClick = {
                                onSaveNode(
                                    node.id,
                                    nameAr,
                                    nameEn.ifBlank { null },
                                    description,
                                    slug,
                                    nodeType,
                                    if (nodeType == NodeType.DEPARTMENT) null else parentId,
                                    imagePath,
                                    sortOrderText.toIntOrNull() ?: node.sortOrder,
                                    status
                                )
                            },
                            enabled = uiState.isOwnerUnlocked && nameAr.isNotBlank(),
                            modifier = Modifier.testTag("save_category_details_button")
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("حفظ البيانات")
                        }
                    }
                }
            }
        }

        // Product Type Attribute Schema Boundary Section
        item {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
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
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "مخطط خصائص نوع المنتج (Product Type Attribute Schema)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (nodeType == NodeType.PRODUCT_TYPE)
                                    "إدارة الخصائص المرتبطة، محاور المتغيرات (Variants)، الحدود الرقمية، الوحدات، ومجموعات القيم."
                                else
                                    "Product Type هو المستوى الوحيد المسموح بربط الخصائص به. غيّر نوع العقدة إلى Product Type لتفعيل المحرر.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        if (nodeType == NodeType.PRODUCT_TYPE) {
                            Button(
                                onClick = { isAddingBinding = true },
                                enabled = uiState.isOwnerUnlocked,
                                modifier = Modifier.testTag("add_attribute_binding_button")
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("ربط خاصية")
                            }
                        }
                    }

                    if (nodeType == NodeType.PRODUCT_TYPE) {
                        if (nodeBindings.isEmpty()) {
                            Text(
                                text = "لا توجد خصائص مرتبطة بهذا الـ Product Type حالياً.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            nodeBindings.forEach { binding ->
                                val attr = attrMap[binding.attributeId]
                                val unit = binding.unitId?.let { uid -> uiState.units.find { it.id == uid } }
                                val valueSet = binding.valueSetId?.let { vid -> uiState.valueSets.find { it.id == vid } }
                                OutlinedCard(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 4.dp)
                                ) {
                                    Column(
                                        verticalArrangement = Arrangement.spacedBy(6.dp),
                                        modifier = Modifier.padding(12.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Column {
                                                Text(
                                                    text = attr?.nameAr ?: binding.attributeId,
                                                    style = MaterialTheme.typography.titleSmall,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                    text = "المجموعة: ${binding.groupName} · الدور: ${binding.parsedRole.labelAr}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                            Row {
                                                IconButton(
                                                    onClick = { editingBinding = binding },
                                                    enabled = uiState.isOwnerUnlocked
                                                ) {
                                                    Icon(Icons.Default.Edit, contentDescription = "تعديل الربط")
                                                }
                                                IconButton(
                                                    onClick = { onRemoveBinding(binding.id) },
                                                    enabled = uiState.isOwnerUnlocked
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.DeleteOutline,
                                                        contentDescription = "إزالة الربط",
                                                        tint = MaterialTheme.colorScheme.error
                                                    )
                                                }
                                            }
                                        }

                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            modifier = Modifier.horizontalScroll(rememberScrollState())
                                        ) {
                                            if (binding.isRequired) {
                                                BadgePill("إلزامي")
                                            }
                                            if (binding.isFilterable) {
                                                BadgePill("قابل للفلترة")
                                            }
                                            if (binding.isVariant) {
                                                BadgePill("محور متغيرات (Variant)")
                                            }
                                            if (binding.minValue != null || binding.maxValue != null) {
                                                BadgePill("الحدود: ${binding.minValue ?: "-"} .. ${binding.maxValue ?: "-"}")
                                            }
                                            if (unit != null) {
                                                BadgePill("الوحدة: ${unit.nameAr} (${unit.symbol.orEmpty()})")
                                            }
                                            if (valueSet != null) {
                                                BadgePill("مجموعة القيم: ${valueSet.nameAr}")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (isAddingBinding || editingBinding != null) {
        ProductTypeBindingDialog(
            productTypeNodeId = node.id,
            existingBinding = editingBinding,
            attributes = uiState.attributes.filter { it.parsedStatus == RecordStatus.ACTIVE },
            units = uiState.units.filter { it.parsedStatus == RecordStatus.ACTIVE },
            valueSets = uiState.valueSets.filter { it.parsedStatus == RecordStatus.ACTIVE },
            nextOrder = nodeBindings.size + 1,
            onDismiss = {
                isAddingBinding = false
                editingBinding = null
            },
            onSave = { id, attrId, roleKey, groupName, req, filt, variant, minV, maxV, unitId, vsetId, allowedVals, order ->
                onSaveBinding(
                    id, node.id, attrId, roleKey, groupName, req, filt, variant,
                    minV, maxV, unitId, vsetId, allowedVals, order
                )
                isAddingBinding = false
                editingBinding = null
            }
        )
    }
}

@Composable
private fun BadgePill(text: String) {
    Surface(
        color = MaterialTheme.colorScheme.secondaryContainer,
        shape = RoundedCornerShape(6.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductTypeBindingDialog(
    productTypeNodeId: String,
    existingBinding: ProductTypeAttributeEntity?,
    attributes: List<AttributeEntity>,
    units: List<MeasurementUnitEntity>,
    valueSets: List<ValueSetEntity>,
    nextOrder: Int,
    onDismiss: () -> Unit,
    onSave: (
        id: String?,
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
    ) -> Unit
) {
    var selectedAttrId by remember {
        mutableStateOf(existingBinding?.attributeId ?: attributes.firstOrNull()?.id.orEmpty())
    }
    val selectedAttr = attributes.find { it.id == selectedAttrId }

    var role by remember { mutableStateOf(existingBinding?.parsedRole ?: AttributeRole.DESCRIPTIVE) }
    var groupName by remember { mutableStateOf(existingBinding?.groupName ?: "المواصفات الأساسية") }
    var isRequired by remember { mutableStateOf(existingBinding?.isRequired ?: false) }
    var isFilterable by remember { mutableStateOf(existingBinding?.isFilterable ?: true) }
    var isVariant by remember { mutableStateOf(existingBinding?.isVariant ?: false) }
    var minValueText by remember { mutableStateOf(existingBinding?.minValue?.toString() ?: "") }
    var maxValueText by remember { mutableStateOf(existingBinding?.maxValue?.toString() ?: "") }
    var selectedUnitId by remember { mutableStateOf(existingBinding?.unitId) }
    var selectedValueSetId by remember { mutableStateOf(existingBinding?.valueSetId) }
    var customValuesInput by remember {
        mutableStateOf(existingBinding?.allowedValues?.joinToString("، ") ?: "")
    }
    var attrMenuExpanded by remember { mutableStateOf(false) }

    val compatibleUnits = remember(selectedAttr, units) {
        if (selectedAttr?.parsedDataType != DataType.NUMBER) emptyList()
        else if (selectedAttr.measurementDimensionId != null) {
            units.filter { it.dimensionId == selectedAttr.measurementDimensionId }
        } else units
    }

    val compatibleValueSets = remember(selectedAttr, valueSets) {
        if (selectedAttr?.parsedDataType != DataType.ENUM) emptyList()
        else valueSets.filter { it.attributeId == null || it.attributeId == selectedAttr.id }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                if (existingBinding == null) "ربط خاصية عامة بنوع المنتج" else "تعديل إعدادات ربط الخاصية"
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                ExposedDropdownMenuBox(
                    expanded = attrMenuExpanded,
                    onExpandedChange = { attrMenuExpanded = !attrMenuExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedAttr?.let { "${it.nameAr} (${it.parsedDataType.labelAr})" } ?: "اختر خاصية",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("الخاصية العامة") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = attrMenuExpanded)
                        },
                        modifier = Modifier
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = attrMenuExpanded,
                        onDismissRequest = { attrMenuExpanded = false }
                    ) {
                        attributes.forEach { attr ->
                            DropdownMenuItem(
                                text = { Text("${attr.nameAr} · ${attr.parsedDataType.labelAr}") },
                                onClick = {
                                    selectedAttrId = attr.id
                                    selectedUnitId = null
                                    selectedValueSetId = null
                                    attrMenuExpanded = false
                                }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = groupName,
                    onValueChange = { groupName = it },
                    label = { Text("مجموعة العرض (Group)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("الدور الدلالي", style = MaterialTheme.typography.labelLarge)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.horizontalScroll(rememberScrollState())
                ) {
                    AttributeRole.entries.forEach { r ->
                        FilterChip(
                            selected = role == r,
                            onClick = {
                                role = r
                                if (r == AttributeRole.VARIANT) isVariant = true
                            },
                            label = { Text(r.labelAr) }
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = isRequired, onCheckedChange = { isRequired = it })
                    Text("إلزامية")
                    Spacer(modifier = Modifier.width(10.dp))
                    Checkbox(checked = isFilterable, onCheckedChange = { isFilterable = it })
                    Text("فلترة")
                    Spacer(modifier = Modifier.width(10.dp))
                    Checkbox(checked = isVariant, onCheckedChange = { isVariant = it })
                    Text("متغير (Variant)")
                }

                if (selectedAttr?.parsedDataType == DataType.NUMBER) {
                    HorizontalDivider()
                    Text("الحدود الرقمية والوحدة الفيزيائية المتوافقة", style = MaterialTheme.typography.labelLarge)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = minValueText,
                            onValueChange = { minValueText = it },
                            label = { Text("الحد الأدنى (Min)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = maxValueText,
                            onValueChange = { maxValueText = it },
                            label = { Text("الحد الأعلى (Max)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    ) {
                        compatibleUnits.forEach { unit ->
                            FilterChip(
                                selected = selectedUnitId == unit.id,
                                onClick = {
                                    selectedUnitId = if (selectedUnitId == unit.id) null else unit.id
                                },
                                label = { Text("${unit.nameAr} (${unit.symbol.orEmpty()})") }
                            )
                        }
                    }
                }

                if (selectedAttr?.parsedDataType == DataType.ENUM) {
                    HorizontalDivider()
                    Text("مجموعة القيم المتوافقة (Value Set)", style = MaterialTheme.typography.labelLarge)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.horizontalScroll(rememberScrollState())
                    ) {
                        compatibleValueSets.forEach { vs ->
                            FilterChip(
                                selected = selectedValueSetId == vs.id,
                                onClick = {
                                    selectedValueSetId = if (selectedValueSetId == vs.id) null else vs.id
                                },
                                label = { Text(vs.nameAr) }
                            )
                        }
                    }
                }

                if (selectedAttr?.parsedDataType == DataType.STRING || selectedAttr?.parsedDataType == DataType.ENUM) {
                    OutlinedTextField(
                        value = customValuesInput,
                        onValueChange = { customValuesInput = it },
                        label = { Text("قيم مخصصة مفصولة بفاصلة (اختياري)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val customValues = customValuesInput.split("،", ",", "|")
                        .map { it.trim() }
                        .filter { it.isNotEmpty() }
                    onSave(
                        existingBinding?.id,
                        selectedAttrId,
                        role.key,
                        groupName,
                        isRequired,
                        isFilterable,
                        isVariant,
                        minValueText.toDoubleOrNull(),
                        maxValueText.toDoubleOrNull(),
                        selectedUnitId,
                        selectedValueSetId,
                        customValues,
                        existingBinding?.sortOrder ?: nextOrder
                    )
                },
                enabled = selectedAttrId.isNotEmpty(),
                modifier = Modifier.testTag("submit_binding_button")
            ) {
                Text("حفظ الربط")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("إلغاء") }
        }
    )
}
