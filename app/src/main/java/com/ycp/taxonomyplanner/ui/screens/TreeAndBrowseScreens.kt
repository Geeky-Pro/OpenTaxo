package com.ycp.taxonomyplanner.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.DriveFileMove
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.FilterAlt
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.ZoomOutMap
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.RangeSlider
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.ycp.taxonomyplanner.R
import com.ycp.taxonomyplanner.data.local.AttributeEntity
import com.ycp.taxonomyplanner.data.local.ProductTypeAttributeEntity
import com.ycp.taxonomyplanner.data.local.TaxonomyNodeEntity
import com.ycp.taxonomyplanner.domain.DomainRules
import com.ycp.taxonomyplanner.domain.FilterType
import com.ycp.taxonomyplanner.domain.NodeType
import com.ycp.taxonomyplanner.domain.RecordStatus
import com.ycp.taxonomyplanner.ui.CatalogUiState
import com.ycp.taxonomyplanner.ui.components.NodeTypeBadge

data class FlattenedTreeItem(
    val node: TaxonomyNodeEntity,
    val depth: Int,
    val hasChildren: Boolean,
    val isExpanded: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TreeWorkspaceScreen(
    uiState: CatalogUiState,
    getAncestors: (String) -> List<TaxonomyNodeEntity>,
    getDisqualifiedParentIds: (String, NodeType) -> Set<String>,
    onFocusRootChange: (String?) -> Unit,
    onOpenFullDetails: (String) -> Unit,
    onSaveNode: (
        id: String?,
        nameAr: String,
        nameEn: String?,
        description: String,
        slug: String,
        nodeType: NodeType,
        parentId: String?,
        sortOrder: Int,
        status: RecordStatus
    ) -> Unit,
    onArchiveOrDeleteNode: (String) -> Unit
) {
    val activeNodes = remember(uiState.nodes) {
        uiState.nodes.filter { it.parsedStatus == RecordStatus.ACTIVE }
    }
    val expandedState = remember { mutableStateMapOf<String, Boolean>() }
    var quickEditNode by remember { mutableStateOf<TaxonomyNodeEntity?>(null) }
    var reparentNode by remember { mutableStateOf<TaxonomyNodeEntity?>(null) }
    var addChildUnderParent by remember { mutableStateOf<TaxonomyNodeEntity?>(null) }
    var showAddRootDepartment by remember { mutableStateOf(false) }
    var confirmDeleteNode by remember { mutableStateOf<TaxonomyNodeEntity?>(null) }

    val childrenByParent = remember(activeNodes) {
        activeNodes.groupBy { it.parentId }
    }

    val flattenedTree = remember(activeNodes, uiState.treeFocusedRootId, expandedState.toMap()) {
        val result = mutableListOf<FlattenedTreeItem>()
        fun traverse(node: TaxonomyNodeEntity, depth: Int) {
            val children = childrenByParent[node.id].orEmpty()
            val expanded = expandedState[node.id] ?: (depth < 2)
            result.add(
                FlattenedTreeItem(
                    node = node,
                    depth = depth,
                    hasChildren = children.isNotEmpty(),
                    isExpanded = expanded
                )
            )
            if (expanded) {
                children.forEach { child -> traverse(child, depth + 1) }
            }
        }

        val focusedRoot = uiState.treeFocusedRootId?.let { id ->
            activeNodes.find { it.id == id }
        }
        if (focusedRoot != null) {
            traverse(focusedRoot, 0)
        } else {
            childrenByParent[null].orEmpty().forEach { root -> traverse(root, 0) }
        }
        result
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp, vertical = 10.dp)
            .testTag("tree_workspace_screen")
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "شجرة التصنيفات الهرمية",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "Department → Category → Subcategory → Product Type",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Button(
                onClick = { showAddRootDepartment = true },
                enabled = uiState.isOwnerUnlocked,
                modifier = Modifier.testTag("tree_add_department_button")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("قسم رئيسي")
            }
        }

        // Focus / Isolate Subtree Breadcrumb Bar
        if (uiState.treeFocusedRootId != null) {
            val focusedNode = activeNodes.find { it.id == uiState.treeFocusedRootId }
            val ancestors = remember(uiState.treeFocusedRootId, activeNodes) {
                getAncestors(uiState.treeFocusedRootId)
            }
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .weight(1f)
                            .horizontalScroll(rememberScrollState())
                    ) {
                        Text(
                            text = "وضع التركيز:",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        ancestors.forEach { anc ->
                            Text(
                                text = anc.nameAr,
                                style = MaterialTheme.typography.labelMedium,
                                modifier = Modifier
                                    .clickable { onFocusRootChange(anc.id) }
                                    .padding(horizontal = 4.dp)
                            )
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        if (focusedNode != null) {
                            Text(
                                text = focusedNode.nameAr,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    TextButton(
                        onClick = { onFocusRootChange(null) },
                        modifier = Modifier.testTag("exit_focus_mode_button")
                    ) {
                        Icon(Icons.Default.ZoomOutMap, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("خروج من التركيز")
                    }
                }
            }
        } else {
            Spacer(modifier = Modifier.height(8.dp))
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(6.dp),
            contentPadding = PaddingValues(bottom = 28.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(flattenedTree, key = { it.node.id }) { item ->
                val indentDp = (item.depth * 20).dp
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (item.node.parsedNodeType == NodeType.PRODUCT_TYPE)
                            MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.2f)
                        else MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = indentDp)
                        .clickable { quickEditNode = item.node }
                        .testTag("tree_node_item_${item.node.id}")
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            if (item.hasChildren) {
                                IconButton(
                                    onClick = {
                                        expandedState[item.node.id] = !item.isExpanded
                                    },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(
                                        imageVector = if (item.isExpanded)
                                            Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = if (item.isExpanded) "طي" else "توسيع"
                                    )
                                }
                            } else {
                                Spacer(modifier = Modifier.width(36.dp))
                            }

                            CategoryThumbnail(
                                imagePath = item.node.imagePath,
                                nodeType = item.node.parsedNodeType,
                                modifier = Modifier.size(32.dp)
                            )

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.node.nameAr,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                NodeTypeBadge(item.node.parsedNodeType)
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (item.node.parsedNodeType != NodeType.PRODUCT_TYPE && uiState.isOwnerUnlocked) {
                                IconButton(
                                    onClick = { addChildUnderParent = item.node },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "إضافة فرع",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            IconButton(
                                onClick = { onFocusRootChange(item.node.id) },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CenterFocusStrong,
                                    contentDescription = "تركيز الفرع",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            IconButton(
                                onClick = { onOpenFullDetails(item.node.id) },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Edit,
                                    contentDescription = "تعديل شامل",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Vaul-equivalent Quick Edit Bottom Sheet
    quickEditNode?.let { selectedNode ->
        ModalBottomSheet(
            onDismissRequest = { quickEditNode = null }
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
                    .padding(bottom = 24.dp)
                    .testTag("quick_edit_bottom_sheet")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text(
                            text = selectedNode.nameAr,
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = "/${selectedNode.slug}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    NodeTypeBadge(selectedNode.parsedNodeType)
                }

                if (selectedNode.description.isNotBlank()) {
                    Text(
                        text = selectedNode.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                HorizontalDivider()

                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Button(
                        onClick = {
                            val id = selectedNode.id
                            quickEditNode = null
                            onOpenFullDetails(id)
                        },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("sheet_open_full_details_button")
                    ) {
                        Icon(Icons.Default.Tune, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            if (selectedNode.parsedNodeType == NodeType.PRODUCT_TYPE)
                                "تعديل شامل وربط الخصائص"
                            else "تعديل شامل وتغيير الصورة"
                        )
                    }
                }

                if (uiState.isOwnerUnlocked) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (selectedNode.parsedNodeType != NodeType.DEPARTMENT) {
                            OutlinedButton(
                                onClick = {
                                    reparentNode = selectedNode
                                    quickEditNode = null
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("sheet_reparent_button")
                            ) {
                                Icon(Icons.Default.DriveFileMove, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("نقل التصنيف (Reparent)")
                            }
                        }
                        OutlinedButton(
                            onClick = {
                                confirmDeleteNode = selectedNode
                                quickEditNode = null
                            },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.error
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("sheet_delete_archive_button")
                        ) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("أرشفة / حذف")
                        }
                    }
                }
            }
        }
    }

    // Reparent Modal enforcing Subtree Disqualification Rule
    reparentNode?.let { nodeToMove ->
        val disqualifiedIds = remember(nodeToMove.id, uiState.nodes) {
            getDisqualifiedParentIds(nodeToMove.id, nodeToMove.parsedNodeType)
        }
        AlertDialog(
            onDismissRequest = { reparentNode = null },
            title = { Text("نقل '${nodeToMove.nameAr}' إلى أب جديد") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "قواعد منع الحلقات (Subtree Disqualification) والتسلسل الهرمي تُعطّل تلقائياً العقدة نفسها وأحفادها والعقد غير المتوافقة مع ${nodeToMove.parsedNodeType.labelAr}.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.height(280.dp)
                    ) {
                        items(activeNodes, key = { it.id }) { candidate ->
                            val isDisqualified = candidate.id in disqualifiedIds
                            val isCurrentParent = candidate.id == nodeToMove.parentId
                            OutlinedCard(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .alpha(if (isDisqualified) 0.42f else 1f)
                                    .clickable(enabled = !isDisqualified) {
                                        onSaveNode(
                                            nodeToMove.id,
                                            nodeToMove.nameAr,
                                            nodeToMove.nameEn,
                                            nodeToMove.description,
                                            nodeToMove.slug,
                                            nodeToMove.parsedNodeType,
                                            candidate.id,
                                            nodeToMove.sortOrder,
                                            nodeToMove.parsedStatus
                                        )
                                        reparentNode = null
                                    }
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(10.dp)
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = candidate.nameAr,
                                            style = MaterialTheme.typography.titleSmall
                                        )
                                        Text(
                                            text = if (isDisqualified) "مستبعد (أحد الأحفاد أو مستوى غير متوافق)"
                                            else if (isCurrentParent) "الأب الحالي"
                                            else "متاح للنقل",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (isDisqualified) MaterialTheme.colorScheme.error
                                            else MaterialTheme.colorScheme.primary
                                        )
                                    }
                                    NodeTypeBadge(candidate.parsedNodeType)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { reparentNode = null }) {
                    Text("إلغاء")
                }
            }
        )
    }

    if (showAddRootDepartment) {
        CreateOrQuickEditNodeDialog(
            title = "إضافة قسم رئيسي (Department)",
            initialNode = null,
            defaultParentId = null,
            allNodes = uiState.nodes,
            onDismiss = { showAddRootDepartment = false },
            onSave = { nameAr, nameEn, desc, slug, _, _ ->
                onSaveNode(
                    null, nameAr, nameEn, desc, slug,
                    NodeType.DEPARTMENT, null, uiState.nodes.size + 1, RecordStatus.ACTIVE
                )
                showAddRootDepartment = false
            }
        )
    }

    addChildUnderParent?.let { parentNode ->
        val defaultChildType = DomainRules.allowedChildTypesForParent(parentNode.parsedNodeType)
            .firstOrNull() ?: NodeType.CATEGORY
        CreateOrQuickEditNodeDialog(
            title = "إضافة فرع تحت '${parentNode.nameAr}'",
            initialNode = TaxonomyNodeEntity(
                id = "",
                nameAr = "",
                slug = "",
                nodeType = defaultChildType.key,
                parentId = parentNode.id
            ),
            defaultParentId = parentNode.id,
            allNodes = uiState.nodes,
            onDismiss = { addChildUnderParent = null },
            onSave = { nameAr, nameEn, desc, slug, nodeType, parentId ->
                onSaveNode(
                    null, nameAr, nameEn, desc, slug,
                    nodeType, parentId, uiState.nodes.size + 1, RecordStatus.ACTIVE
                )
                addChildUnderParent = null
            }
        )
    }

    confirmDeleteNode?.let { target ->
        AlertDialog(
            onDismissRequest = { confirmDeleteNode = null },
            title = { Text("تأكيد أرشفة / حذف '${target.nameAr}'") },
            text = {
                Text("يمنع النظام حذف أو أرشفة أي عقدة لديها فروع نشطة، ويؤرشف السجلات المرجعية بأمان دون فقدان البيانات.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        onArchiveOrDeleteNode(target.id)
                        confirmDeleteNode = null
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("تأكيد")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmDeleteNode = null }) {
                    Text("إلغاء")
                }
            }
        )
    }
}

@Composable
fun StorefrontBrowseScreen(
    uiState: CatalogUiState,
    getAncestors: (String) -> List<TaxonomyNodeEntity>,
    onSelectBrowseNode: (String?) -> Unit,
    onOpenCategoryEditor: (String) -> Unit
) {
    val activeNodes = remember(uiState.nodes) {
        uiState.nodes.filter { it.parsedStatus == RecordStatus.ACTIVE }
    }
    val currentNode = remember(uiState.browseCurrentNodeId, activeNodes) {
        uiState.browseCurrentNodeId?.let { id -> activeNodes.find { it.id == id } }
    }
    val children = remember(currentNode, activeNodes) {
        activeNodes.filter { it.parentId == currentNode?.id }
    }
    val ancestors = remember(currentNode, activeNodes) {
        currentNode?.let { getAncestors(it.id) }.orEmpty()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .testTag("storefront_browse_screen")
    ) {
        // Storefront Breadcrumbs
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(bottom = 12.dp)
        ) {
            Surface(
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = RoundedCornerShape(999.dp),
                modifier = Modifier
                    .clickable { onSelectBrowseNode(null) }
                    .testTag("browse_root_crumb")
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.Home, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("جميع الأقسام", style = MaterialTheme.typography.labelMedium)
                }
            }

            ancestors.forEach { anc ->
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 4.dp)
                )
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(999.dp),
                    modifier = Modifier.clickable { onSelectBrowseNode(anc.id) }
                ) {
                    Text(
                        text = anc.nameAr,
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }

            if (currentNode != null) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 4.dp)
                )
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    shape = RoundedCornerShape(999.dp)
                ) {
                    Text(
                        text = currentNode.nameAr,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = currentNode?.nameAr ?: "تصفح جميع أقسام المتجر",
                    style = MaterialTheme.typography.headlineMedium
                )
                Text(
                    text = when {
                        children.isNotEmpty() -> "يحتوي على ${children.size} قسم فرعي"
                        currentNode?.parsedNodeType == NodeType.PRODUCT_TYPE -> "محاكاة بطاقة مواصفات المنتج النهائي (Product Blueprint)"
                        else -> "لا توجد تصنيفات فرعية بعد"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (currentNode != null) {
                OutlinedButton(onClick = { onOpenCategoryEditor(currentNode.id) }) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("تحرير العقدة")
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (children.isNotEmpty()) {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 24.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(children, key = { it.id }) { child ->
                    val subCount = activeNodes.count { it.parentId == child.id }
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectBrowseNode(child.id) }
                            .testTag("browse_card_${child.id}")
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp)
                        ) {
                            CategoryThumbnail(
                                imagePath = child.imagePath,
                                nodeType = child.parsedNodeType,
                                modifier = Modifier.size(56.dp)
                            )
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = child.nameAr,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    NodeTypeBadge(child.parsedNodeType)
                                }
                                if (child.description.isNotBlank()) {
                                    Text(
                                        text = child.description,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )
                                }
                                Text(
                                    text = if (child.parsedNodeType == NodeType.PRODUCT_TYPE)
                                        "اضغط لمعاينة بطاقة مواصفات المنتج النهائي ←"
                                    else "$subCount أقسام فرعية",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(top = 6.dp)
                                )
                            }
                        }
                    }
                }
            }
        } else if (currentNode?.parsedNodeType == NodeType.PRODUCT_TYPE) {
            ProductBlueprintSimulator(
                productTypeNode = currentNode,
                bindings = uiState.bindings.filter { it.productTypeNodeId == currentNode.id },
                attributes = uiState.attributes,
                unitsById = uiState.units.associateBy { it.id },
                valuesBySetId = uiState.attributeValues
                    .filter { it.parsedStatus == RecordStatus.ACTIVE }
                    .groupBy { it.valueSetId },
                onConfigureAttributes = { onOpenCategoryEditor(currentNode.id) }
            )
        }
    }
}

@Composable
private fun ProductBlueprintSimulator(
    productTypeNode: TaxonomyNodeEntity,
    bindings: List<ProductTypeAttributeEntity>,
    attributes: List<AttributeEntity>,
    unitsById: Map<String, com.ycp.taxonomyplanner.data.local.MeasurementUnitEntity>,
    valuesBySetId: Map<String, List<com.ycp.taxonomyplanner.data.local.AttributeValueEntity>>,
    onConfigureAttributes: () -> Unit
) {
    val attrMap = remember(attributes) { attributes.associateBy { it.id } }
    val selectedOptionByBinding = remember { mutableStateMapOf<String, String>() }
    val booleanToggleByBinding = remember { mutableStateMapOf<String, Boolean>() }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(bottom = 28.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                ),
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Inventory2,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "مخطط مواصفات المنتج (Product Blueprint)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Button(onClick = onConfigureAttributes) {
                            Text("تخصيص الخصائص")
                        }
                    }
                    Text(
                        text = "معاينة تفاعلية لكيفية ظهور محاور المتغيرات (Variants) وفلاتر المتجر والمواصفات الفنية لنوع المنتج '${productTypeNode.nameAr}'.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        if (bindings.isEmpty()) {
            item {
                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp)
                    ) {
                        Text("لم يتم ربط أي خصائص بنوع المنتج هذا بعد.", style = MaterialTheme.typography.titleSmall)
                        Button(onClick = onConfigureAttributes) {
                            Text("ربط خصائص الآن")
                        }
                    }
                }
            }
        } else {
            items(bindings, key = { it.id }) { binding ->
                val attr = attrMap[binding.attributeId] ?: return@items
                val unitSymbol = binding.unitId?.let { unitsById[it]?.symbol } ?: attr.legacyUnit
                val options = if (binding.valueSetId != null) {
                    valuesBySetId[binding.valueSetId].orEmpty().map { it.labelAr }
                } else {
                    binding.allowedValues
                }

                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(14.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = attr.nameAr,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                if (binding.isRequired) {
                                    Text(
                                        text = " *",
                                        color = MaterialTheme.colorScheme.error,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (binding.isVariant) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.tertiaryContainer,
                                        contentColor = MaterialTheme.colorScheme.onTertiaryContainer,
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = "محور متغير (Variant Axis)",
                                            style = MaterialTheme.typography.labelSmall,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                if (binding.isFilterable) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.secondaryContainer,
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.FilterAlt,
                                                contentDescription = null,
                                                modifier = Modifier.size(12.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = attr.parsedFilterType.labelAr,
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        when (attr.parsedFilterType) {
                            FilterType.RANGE -> {
                                val minV = (binding.minValue ?: 0.0).toFloat()
                                val maxV = (binding.maxValue ?: 100.0).toFloat().coerceAtLeast(minV + 1f)
                                var range by remember(minV, maxV) { mutableStateOf(minV..maxV) }
                                Text(
                                    text = "النطاق المسموح: ${range.start.toInt()} – ${range.endInclusive.toInt()} ${unitSymbol.orEmpty()}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                RangeSlider(
                                    value = range,
                                    onValueChange = { range = it },
                                    valueRange = minV..maxV
                                )
                            }

                            FilterType.TOGGLE -> {
                                val checked = booleanToggleByBinding[binding.id] ?: true
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = if (checked) "نعم (مفعّل)" else "لا",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Switch(
                                        checked = checked,
                                        onCheckedChange = { booleanToggleByBinding[binding.id] = it }
                                    )
                                }
                            }

                            else -> {
                                val displayOptions = options.ifEmpty { listOf("خيار قياسي 1", "خيار قياسي 2") }
                                val currentSelected = selectedOptionByBinding[binding.id] ?: displayOptions.first()
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState())
                                ) {
                                    displayOptions.forEach { opt ->
                                        FilterChip(
                                            selected = currentSelected == opt,
                                            onClick = { selectedOptionByBinding[binding.id] = opt },
                                            leadingIcon = if (currentSelected == opt) {
                                                {
                                                    Icon(
                                                        imageVector = Icons.Default.CheckCircle,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                }
                                            } else null,
                                            label = { Text(opt) }
                                        )
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

@Composable
fun CategoryThumbnail(
    imagePath: String?,
    nodeType: NodeType,
    modifier: Modifier = Modifier
) {
    val drawableRes = when (imagePath) {
        "drawable://cat_alanarh", "/categories/alanarh_1789687557031.webp" -> R.drawable.cat_alanarh
        "drawable://cat_indoor_lighting", "/categories/indoor_lighting__1790270071374.png" -> R.drawable.cat_indoor_lighting
        "drawable://cat_outdoor_lighting", "/categories/outdoor_lighting__1790270103633.png" -> R.drawable.cat_outdoor_lighting
        "drawable://cat_decorative_lighting", "/categories/decorative_lighting__1790270134567.png" -> R.drawable.cat_decorative_lighting
        "drawable://cat_lighting_accessories", "/categories/lighting_accessories___accessories__1790270199467.png" -> R.drawable.cat_lighting_accessories
        "drawable://cat_sockets", "/categories/sockets_1790270294200.png" -> R.drawable.cat_sockets
        else -> null
    }

    if (drawableRes != null) {
        Image(
            painter = painterResource(id = drawableRes),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = modifier
                .clip(RoundedCornerShape(10.dp))
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(10.dp))
        )
    } else if (!imagePath.isNullOrBlank() && (imagePath.startsWith("content://") || imagePath.startsWith("http") || imagePath.startsWith("file://"))) {
        AsyncImage(
            model = imagePath,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = modifier
                .clip(RoundedCornerShape(10.dp))
                .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(10.dp))
        )
    } else {
        Surface(
            color = when (nodeType) {
                NodeType.PRODUCT_TYPE -> MaterialTheme.colorScheme.tertiaryContainer
                NodeType.DEPARTMENT -> MaterialTheme.colorScheme.primaryContainer
                else -> MaterialTheme.colorScheme.secondaryContainer
            },
            shape = RoundedCornerShape(10.dp),
            modifier = modifier
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = when (nodeType) {
                        NodeType.PRODUCT_TYPE -> Icons.Default.Inventory2
                        NodeType.DEPARTMENT -> Icons.Default.FolderOpen
                        else -> Icons.Default.Folder
                    },
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
