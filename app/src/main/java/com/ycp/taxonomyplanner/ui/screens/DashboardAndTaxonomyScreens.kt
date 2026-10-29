package com.ycp.taxonomyplanner.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesomeMosaic
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.ycp.taxonomyplanner.data.local.TaxonomyNodeEntity
import com.ycp.taxonomyplanner.domain.DomainRules
import com.ycp.taxonomyplanner.domain.NodeType
import com.ycp.taxonomyplanner.domain.RecordStatus
import com.ycp.taxonomyplanner.ui.CatalogUiState
import com.ycp.taxonomyplanner.ui.WorkspaceRoute
import com.ycp.taxonomyplanner.ui.components.NodeTypeBadge
import com.ycp.taxonomyplanner.ui.theme.IbmPlexMonoFontFamily

@Composable
fun DashboardScreen(
    uiState: CatalogUiState,
    onNavigate: (WorkspaceRoute) -> Unit,
    onOpenExport: () -> Unit,
    onOpenSyncDialog: () -> Unit,
    onOpenSpotlight: () -> Unit
) {
    val activeNodes = remember(uiState.nodes) {
        uiState.nodes.filter { it.parsedStatus == RecordStatus.ACTIVE }
    }
    val departmentCount = remember(activeNodes) {
        activeNodes.count { it.parsedNodeType == NodeType.DEPARTMENT }
    }
    val productTypeCount = remember(activeNodes) {
        activeNodes.count { it.parsedNodeType == NodeType.PRODUCT_TYPE }
    }
    val activeAttrCount = remember(uiState.attributes) {
        uiState.attributes.count { it.parsedStatus == RecordStatus.ACTIVE }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier
            .fillMaxSize()
            .testTag("dashboard_screen")
    ) {
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f),
                                    MaterialTheme.colorScheme.surface
                                )
                            )
                        )
                        .padding(20.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Surface(
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                            contentColor = MaterialTheme.colorScheme.primary,
                            shape = RoundedCornerShape(999.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Layers,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "YCP · Taxonomy & Catalog Planner",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Text(
                            text = "مركز إدارة التصنيفات والكتالوج المركزي",
                            style = MaterialTheme.typography.headlineMedium
                        )
                        Text(
                            text = "نقطة البداية لإدارة بنية الكتالوج الهرمية، استعراض أنواع المنتجات (Product Types)، وربط الخصائص العامة والوحدات ومجموعات القيم.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.padding(top = 4.dp)
                        ) {
                            Button(
                                onClick = { onNavigate(WorkspaceRoute.TAXONOMY_LIST) },
                                modifier = Modifier.testTag("hero_open_taxonomy_button")
                            ) {
                                Text("فتح إدارة التصنيفات")
                            }
                            OutlinedButton(
                                onClick = onOpenExport,
                                modifier = Modifier.testTag("hero_export_json_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Download,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("تصدير JSON")
                            }
                        }
                    }
                }
            }
        }

        // Quick Search & Status bar card
        item {
            OutlinedCard(
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .clickable { onOpenSpotlight() }
                            .padding(horizontal = 12.dp, vertical = 10.dp)
                            .testTag("dashboard_spotlight_bar")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "بحث",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "بحث فوري في التصنيفات والخصائص…",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    OutlinedButton(
                        onClick = onOpenSyncDialog,
                        modifier = Modifier.testTag("dashboard_owner_sync_button")
                    ) {
                        Icon(
                            imageVector = if (uiState.isOwnerUnlocked) Icons.Default.LockOpen else Icons.Default.Lock,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (uiState.isOwnerUnlocked) "المالك" else "مقفل")
                    }
                }
            }
        }

        // KPI Summary Grid (2x2)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    KpiStatCard(
                        label = "إجمالي العقد النشطة",
                        value = activeNodes.size.toString(),
                        icon = Icons.Default.Category,
                        modifier = Modifier.weight(1f)
                    )
                    KpiStatCard(
                        label = "أنواع المنتجات",
                        value = productTypeCount.toString(),
                        icon = Icons.Default.Inventory2,
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    KpiStatCard(
                        label = "الخصائص العامة",
                        value = activeAttrCount.toString(),
                        icon = Icons.Default.Style,
                        modifier = Modifier.weight(1f)
                    )
                    KpiStatCard(
                        label = "الأقسام الرئيسية",
                        value = departmentCount.toString(),
                        icon = Icons.Default.Layers,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        item {
            Text(
                text = "مساحات العمل الرئيسية",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        item {
            WorkspaceDestinationCard(
                title = "إدارة التصنيفات وأنواع المنتجات",
                description = "استعراض كل عقد الشجرة، البحث والتصفية حسب النوع، وفتح تفاصيل أي تصنيف أو Product Type.",
                metric = "${uiState.nodes.size} عقدة",
                icon = Icons.Default.Category,
                isPrimary = true,
                testTag = "workspace_card_taxonomy",
                onClick = { onNavigate(WorkspaceRoute.TAXONOMY_LIST) }
            )
        }

        item {
            WorkspaceDestinationCard(
                title = "شجرة التصنيفات التفاعلية",
                description = "عرض هرمي مرئي لإضافة الأقسام وتعديلها السريع، وضع التركيز (Focus Mode)، وإعادة تنظيم العلاقات.",
                metric = "$departmentCount أقسام رئيسية",
                icon = Icons.Default.AccountTree,
                isPrimary = false,
                testTag = "workspace_card_tree",
                onClick = { onNavigate(WorkspaceRoute.TREE) }
            )
        }

        item {
            WorkspaceDestinationCard(
                title = "معرض المتجر ومحاكاة المنتج",
                description = "تصفح الأقسام كما تظهر في بنية المتجر وانتقل بين المستويات حتى بطاقة مواصفات المنتج النهائي.",
                metric = "تصفح هرمي",
                icon = Icons.Default.Storefront,
                isPrimary = false,
                testTag = "workspace_card_browse",
                onClick = { onNavigate(WorkspaceRoute.BROWSE) }
            )
        }

        item {
            WorkspaceDestinationCard(
                title = "مركز الخصائص العامة",
                description = "إدارة تعريفات الخصائص، المرادفات، توافق أنواع البيانات والفلاتر، والأبعاد الفيزيائية.",
                metric = "${uiState.attributes.size} خاصية",
                icon = Icons.Default.Style,
                isPrimary = false,
                testTag = "workspace_card_attributes",
                onClick = { onNavigate(WorkspaceRoute.ATTRIBUTES_CENTER) }
            )
        }

        item {
            WorkspaceDestinationCard(
                title = "التعريفات المركزية (5 مراكز)",
                description = "إدارة السمات وأنواع البيانات ومجموعات القيم والوحدات والأبعاد وقواعد التحويل والحاسبة.",
                metric = "${uiState.valueSets.size} مجموعات قيم · ${uiState.units.size} وحدة",
                icon = Icons.Default.Tune,
                isPrimary = false,
                testTag = "workspace_card_definitions",
                onClick = { onNavigate(WorkspaceRoute.DEFINITIONS_HUB) }
            )
        }

        item {
            OutlinedCard(
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.Top,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Icon(
                        imageVector = if (uiState.supabaseConfigured) Icons.Default.CloudDone else Icons.Default.AutoAwesomeMosaic,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "حفظ محلي فوري (Room) + تكامل Supabase",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "تُحفظ جميع التعديلات فوراً على الجهاز مع فرض قواعد التسلسل الهرمي (Department → Category → Subcategory → Product Type) وتوافق الفلاتر والوحدات.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun KpiStatCard(
    label: String,
    value: String,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier
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
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
            }
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun WorkspaceDestinationCard(
    title: String,
    description: String,
    metric: String,
    icon: ImageVector,
    isPrimary: Boolean,
    testTag: String,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isPrimary)
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.28f)
            else MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag(testTag)
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
                Surface(
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                    contentColor = MaterialTheme.colorScheme.primary,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        modifier = Modifier
                            .padding(10.dp)
                            .size(22.dp)
                    )
                }
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.OpenInNew,
                    contentDescription = "فتح",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp)
                )
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(999.dp)
            ) {
                Text(
                    text = metric,
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
fun TaxonomyListScreen(
    uiState: CatalogUiState,
    getFullPathAr: (String) -> String,
    onOpenCategoryDetail: (String) -> Unit,
    onOpenInTree: (String) -> Unit,
    onCreateNode: (
        nameAr: String,
        nameEn: String?,
        description: String,
        slug: String,
        nodeType: NodeType,
        parentId: String?
    ) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedTypeFilter by remember { mutableStateOf<NodeType?>(null) }
    var showArchived by remember { mutableStateOf(false) }
    var isCreateDialogOpen by remember { mutableStateOf(false) }

    val bindingsCountByNode = remember(uiState.bindings) {
        uiState.bindings.groupBy { it.productTypeNodeId }.mapValues { it.value.size }
    }

    val filteredNodes = remember(uiState.nodes, searchQuery, selectedTypeFilter, showArchived) {
        val q = searchQuery.trim().lowercase()
        uiState.nodes.filter { node ->
            val statusMatches = if (showArchived) true else node.parsedStatus == RecordStatus.ACTIVE
            val typeMatches = selectedTypeFilter == null || node.parsedNodeType == selectedTypeFilter
            val queryMatches = q.isEmpty() ||
                node.nameAr.lowercase().contains(q) ||
                node.nameEn?.lowercase()?.contains(q) == true ||
                node.slug.lowercase().contains(q) ||
                node.description.lowercase().contains(q)
            statusMatches && typeMatches && queryMatches
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .testTag("taxonomy_list_screen")
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "جميع التصنيفات وأنواع المنتجات",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "قائمة موحدة لكل عقد الشجرة (${filteredNodes.size} سجل). افتح أي سجل لإدارة بياناته أو خصائص Product Type.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = { isCreateDialogOpen = true },
                enabled = uiState.isOwnerUnlocked,
                modifier = Modifier.testTag("taxonomy_add_node_button")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("إضافة عقدة")
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("ابحث بالاسم العربي، الإنجليزي، أو الرابط (Slug)…") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("taxonomy_search_input")
        )

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(vertical = 8.dp)
        ) {
            FilterChip(
                selected = selectedTypeFilter == null,
                onClick = { selectedTypeFilter = null },
                label = { Text("الكل") }
            )
            NodeType.entries.forEach { type ->
                FilterChip(
                    selected = selectedTypeFilter == type,
                    onClick = {
                        selectedTypeFilter = if (selectedTypeFilter == type) null else type
                    },
                    label = {
                        Text(
                            when (type) {
                                NodeType.DEPARTMENT -> "أقسام رئيسية"
                                NodeType.CATEGORY -> "تصنيفات"
                                NodeType.SUBCATEGORY -> "تصنيفات فرعية"
                                NodeType.PRODUCT_TYPE -> "Product Types"
                            }
                        )
                    }
                )
            }
            FilterChip(
                selected = showArchived,
                onClick = { showArchived = !showArchived },
                label = { Text("إظهار المؤرشف") }
            )
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(bottom = 24.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(filteredNodes, key = { it.id }) { node ->
                val attrCount = bindingsCountByNode[node.id] ?: 0
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenCategoryDetail(node.id) }
                        .testTag("taxonomy_node_card_${node.id}")
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
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = node.nameAr,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                if (!node.nameEn.isNullOrBlank()) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = node.nameEn,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            NodeTypeBadge(node.parsedNodeType)
                        }

                        Text(
                            text = "المسار: ${getFullPathAr(node.id)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        if (node.description.isNotBlank()) {
                            Text(
                                text = node.description,
                                style = MaterialTheme.typography.bodySmall,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "/${node.slug}",
                                    fontFamily = IbmPlexMonoFontFamily,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                if (node.parsedNodeType == NodeType.PRODUCT_TYPE) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.tertiaryContainer,
                                        contentColor = MaterialTheme.colorScheme.onTertiaryContainer,
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = "$attrCount خصائص مرتبطة",
                                            style = MaterialTheme.typography.labelSmall,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                if (node.parsedStatus == RecordStatus.ARCHIVED) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.errorContainer,
                                        contentColor = MaterialTheme.colorScheme.onErrorContainer,
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = "مؤرشف",
                                            style = MaterialTheme.typography.labelSmall,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                TextButton(onClick = { onOpenInTree(node.id) }) {
                                    Text("في الشجرة")
                                }
                                TextButton(onClick = { onOpenCategoryDetail(node.id) }) {
                                    Text(
                                        if (node.parsedNodeType == NodeType.PRODUCT_TYPE)
                                            "إدارة الخصائص"
                                        else "التفاصيل"
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (isCreateDialogOpen) {
        CreateOrQuickEditNodeDialog(
            title = "إضافة عقدة جديدة في الشجرة",
            initialNode = null,
            defaultParentId = null,
            allNodes = uiState.nodes,
            onDismiss = { isCreateDialogOpen = false },
            onSave = { nameAr, nameEn, desc, slug, nodeType, parentId ->
                onCreateNode(nameAr, nameEn, desc, slug, nodeType, parentId)
                isCreateDialogOpen = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateOrQuickEditNodeDialog(
    title: String,
    initialNode: TaxonomyNodeEntity?,
    defaultParentId: String?,
    allNodes: List<TaxonomyNodeEntity>,
    onDismiss: () -> Unit,
    onSave: (
        nameAr: String,
        nameEn: String?,
        description: String,
        slug: String,
        nodeType: NodeType,
        parentId: String?
    ) -> Unit
) {
    val initialParent = initialNode?.parentId ?: defaultParentId
    val parentEntity = allNodes.find { it.id == initialParent }
    val initialAllowedTypes = DomainRules.allowedChildTypesForParent(parentEntity?.parsedNodeType)

    var nameAr by remember { mutableStateOf(initialNode?.nameAr ?: "") }
    var nameEn by remember { mutableStateOf(initialNode?.nameEn ?: "") }
    var description by remember { mutableStateOf(initialNode?.description ?: "") }
    var slug by remember { mutableStateOf(initialNode?.slug ?: "") }
    var selectedParentId by remember { mutableStateOf(initialParent) }
    var selectedNodeType by remember {
        mutableStateOf(
            initialNode?.parsedNodeType
                ?: initialAllowedTypes.firstOrNull()
                ?: NodeType.DEPARTMENT
        )
    }
    var parentExpanded by remember { mutableStateOf(false) }

    val activeCandidateParents = remember(allNodes, initialNode, selectedNodeType) {
        val allowedParentTypes = DomainRules.allowedParentTypesForNode(selectedNodeType)
        allNodes.filter {
            it.id != initialNode?.id &&
                it.parsedStatus == RecordStatus.ACTIVE &&
                it.parsedNodeType in allowedParentTypes
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, style = MaterialTheme.typography.titleLarge) },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = nameAr,
                    onValueChange = {
                        nameAr = it
                        if (initialNode == null) {
                            slug = DomainRules.normalizeSlug(nameEn.ifBlank { it })
                        }
                    },
                    label = { Text("الاسم بالعربية *") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("node_form_name_ar")
                )

                OutlinedTextField(
                    value = nameEn,
                    onValueChange = {
                        nameEn = it
                        if (initialNode == null && it.isNotBlank()) {
                            slug = DomainRules.normalizeSlug(it)
                        }
                    },
                    label = { Text("الاسم بالإنجليزية (اختياري)") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("node_form_name_en")
                )

                OutlinedTextField(
                    value = slug,
                    onValueChange = { slug = it },
                    label = { Text("الرابط المعياري (Slug)") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("node_form_slug")
                )

                Text(
                    text = "نوع العقدة (يتحدد حسب المستوى الهرمي)",
                    style = MaterialTheme.typography.labelLarge
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                ) {
                    NodeType.entries.forEach { nt ->
                        FilterChip(
                            selected = selectedNodeType == nt,
                            onClick = {
                                selectedNodeType = nt
                                if (nt == NodeType.DEPARTMENT) {
                                    selectedParentId = null
                                } else {
                                    val allowedParents = DomainRules.allowedParentTypesForNode(nt)
                                    val currentParent = allNodes.find { it.id == selectedParentId }
                                    if (currentParent == null || currentParent.parsedNodeType !in allowedParents) {
                                        selectedParentId = allNodes.firstOrNull {
                                            it.parsedStatus == RecordStatus.ACTIVE &&
                                                it.parsedNodeType in allowedParents
                                        }?.id
                                    }
                                }
                            },
                            label = { Text(nt.labelAr) }
                        )
                    }
                }

                if (selectedNodeType != NodeType.DEPARTMENT) {
                    ExposedDropdownMenuBox(
                        expanded = parentExpanded,
                        onExpandedChange = { parentExpanded = !parentExpanded }
                    ) {
                        val selectedParentObj = allNodes.find { it.id == selectedParentId }
                        OutlinedTextField(
                            value = selectedParentObj?.let { "${it.nameAr} (${it.parsedNodeType.labelEn})" }
                                ?: "اختر التصنيف الأب",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("التصنيف الأب") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = parentExpanded)
                            },
                            modifier = Modifier
                                .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                                .fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = parentExpanded,
                            onDismissRequest = { parentExpanded = false }
                        ) {
                            activeCandidateParents.forEach { candidate ->
                                DropdownMenuItem(
                                    text = { Text("${candidate.nameAr} · ${candidate.parsedNodeType.labelAr}") },
                                    onClick = {
                                        selectedParentId = candidate.id
                                        parentExpanded = false
                                    }
                                )
                            }
                        }
                    }
                } else {
                    Text(
                        text = "القسم الرئيسي (Department) يوضع دائماً في الجذر.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("الوصف (اختياري)") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        nameAr,
                        nameEn.ifBlank { null },
                        description,
                        slug,
                        selectedNodeType,
                        if (selectedNodeType == NodeType.DEPARTMENT) null else selectedParentId
                    )
                },
                enabled = nameAr.isNotBlank(),
                modifier = Modifier.testTag("node_form_submit_button")
            ) {
                Text("حفظ")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("إلغاء")
            }
        }
    )
}
