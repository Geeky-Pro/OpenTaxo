package com.ycp.taxonomyplanner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.ycp.taxonomyplanner.data.CatalogRepository
import com.ycp.taxonomyplanner.data.local.CatalogDatabase
import com.ycp.taxonomyplanner.ui.CatalogUiState
import com.ycp.taxonomyplanner.ui.CatalogViewModel
import com.ycp.taxonomyplanner.ui.WorkspaceRoute
import com.ycp.taxonomyplanner.ui.components.CloudSyncAndOwnerDialog
import com.ycp.taxonomyplanner.ui.components.ExportCatalogDialog
import com.ycp.taxonomyplanner.ui.components.SpotlightSearchDialog
import com.ycp.taxonomyplanner.ui.screens.AttributesCenterScreen
import com.ycp.taxonomyplanner.ui.screens.CategoryDetailScreen
import com.ycp.taxonomyplanner.ui.screens.DashboardScreen
import com.ycp.taxonomyplanner.ui.screens.DataTypesCenterScreen
import com.ycp.taxonomyplanner.ui.screens.DefinitionsHubScreen
import com.ycp.taxonomyplanner.ui.screens.MeasurementsAndConversionsScreen
import com.ycp.taxonomyplanner.ui.screens.StorefrontBrowseScreen
import com.ycp.taxonomyplanner.ui.screens.TaxonomyListScreen
import com.ycp.taxonomyplanner.ui.screens.TreeWorkspaceScreen
import com.ycp.taxonomyplanner.ui.screens.ValueSetsCenterScreen
import com.ycp.taxonomyplanner.ui.theme.YcpTaxonomyTheme

private data class PrimaryNavItem(
    val route: WorkspaceRoute,
    val label: String,
    val icon: ImageVector,
    val testTag: String
)

private val primaryNavItems = listOf(
    PrimaryNavItem(WorkspaceRoute.DASHBOARD, "الرئيسية", Icons.Default.Home, "nav_item_dashboard"),
    PrimaryNavItem(WorkspaceRoute.TAXONOMY_LIST, "التصنيفات", Icons.Default.Category, "nav_item_taxonomy"),
    PrimaryNavItem(WorkspaceRoute.TREE, "الشجرة", Icons.Default.AccountTree, "nav_item_tree"),
    PrimaryNavItem(WorkspaceRoute.BROWSE, "المتجر", Icons.Default.Storefront, "nav_item_browse"),
    PrimaryNavItem(WorkspaceRoute.DEFINITIONS_HUB, "التعريفات", Icons.Default.Tune, "nav_item_definitions")
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val database = CatalogDatabase.getInstance(applicationContext)
        val repository = CatalogRepository(database.catalogDao())

        setContent {
            val viewModel: CatalogViewModel = viewModel(
                factory = CatalogViewModel.provideFactory(repository)
            )
            val uiState by viewModel.uiState.collectAsStateWithLifecycle()

            YcpTaxonomyTheme(darkTheme = uiState.isDarkTheme) {
                YcpPlannerAppShell(
                    uiState = uiState,
                    viewModel = viewModel
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun YcpPlannerAppShell(
    uiState: CatalogUiState,
    viewModel: CatalogViewModel
) {
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.snackbarMessage) {
        val msg = uiState.snackbarMessage
        if (msg != null) {
            snackbarHostState.showSnackbar(msg)
            viewModel.clearSnackbar()
        }
    }

    BackHandler(enabled = uiState.currentRoute != WorkspaceRoute.DASHBOARD || uiState.browseCurrentNodeId != null) {
        viewModel.navigateBack()
    }

    val isDefinitionSubroute = uiState.currentRoute in setOf(
        WorkspaceRoute.DEFINITIONS_HUB,
        WorkspaceRoute.ATTRIBUTES_CENTER,
        WorkspaceRoute.DATA_TYPES_CENTER,
        WorkspaceRoute.VALUE_SETS_CENTER,
        WorkspaceRoute.MEASUREMENTS_CENTER,
        WorkspaceRoute.UNIT_CONVERSIONS_CENTER
    )

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val isWideScreen = maxWidth >= 700.dp

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                color = MaterialTheme.colorScheme.primary,
                                contentColor = MaterialTheme.colorScheme.onPrimary,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.size(32.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = "Y",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "YCP مخطط التصنيفات",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    },
                    actions = {
                        IconButton(
                            onClick = { viewModel.setSpotlightOpen(true) },
                            modifier = Modifier.testTag("top_bar_spotlight_button")
                        ) {
                            Icon(Icons.Default.Search, contentDescription = "بحث فوري")
                        }
                        IconButton(
                            onClick = { viewModel.openExportDialog() },
                            modifier = Modifier.testTag("top_bar_export_button")
                        ) {
                            Icon(Icons.Default.Download, contentDescription = "تصدير الكتالوج")
                        }
                        IconButton(
                            onClick = { viewModel.setSyncDialogOpen(true) },
                            modifier = Modifier.testTag("top_bar_owner_lock_button")
                        ) {
                            Icon(
                                imageVector = if (uiState.isOwnerUnlocked) Icons.Default.LockOpen else Icons.Default.Lock,
                                contentDescription = "قفل المالك والمزامنة",
                                tint = if (uiState.isOwnerUnlocked)
                                    MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.error
                            )
                        }
                        IconButton(
                            onClick = { viewModel.toggleDarkTheme() },
                            modifier = Modifier.testTag("top_bar_theme_toggle")
                        ) {
                            Icon(
                                imageVector = if (uiState.isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                                contentDescription = "تبديل المظهر"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            },
            bottomBar = {
                if (!isWideScreen) {
                    NavigationBar(
                        windowInsets = WindowInsets.navigationBars,
                        modifier = Modifier.testTag("bottom_navigation_bar")
                    ) {
                        primaryNavItems.forEach { item ->
                            val selected = uiState.currentRoute == item.route ||
                                (item.route == WorkspaceRoute.DEFINITIONS_HUB && isDefinitionSubroute)
                            NavigationBarItem(
                                selected = selected,
                                onClick = { viewModel.navigateTo(item.route) },
                                icon = { Icon(item.icon, contentDescription = item.label) },
                                label = { Text(item.label) },
                                modifier = Modifier.testTag(item.testTag)
                            )
                        }
                    }
                }
            },
            snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
        ) { innerPadding ->
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                if (isWideScreen) {
                    NavigationRail(
                        modifier = Modifier.testTag("side_navigation_rail")
                    ) {
                        primaryNavItems.forEach { item ->
                            val selected = uiState.currentRoute == item.route ||
                                (item.route == WorkspaceRoute.DEFINITIONS_HUB && isDefinitionSubroute)
                            NavigationRailItem(
                                selected = selected,
                                onClick = { viewModel.navigateTo(item.route) },
                                icon = { Icon(item.icon, contentDescription = item.label) },
                                label = { Text(item.label) },
                                modifier = Modifier.testTag(item.testTag)
                            )
                        }
                    }
                }

                Box(modifier = Modifier.weight(1f)) {
                    when (uiState.currentRoute) {
                        WorkspaceRoute.DASHBOARD -> DashboardScreen(
                            uiState = uiState,
                            onNavigate = { viewModel.navigateTo(it) },
                            onOpenExport = { viewModel.openExportDialog() },
                            onOpenSyncDialog = { viewModel.setSyncDialogOpen(true) },
                            onOpenSpotlight = { viewModel.setSpotlightOpen(true) }
                        )

                        WorkspaceRoute.TAXONOMY_LIST -> TaxonomyListScreen(
                            uiState = uiState,
                            getFullPathAr = { id -> viewModel.repository.getFullPathAr(id, uiState.nodes) },
                            onOpenCategoryDetail = { id -> viewModel.openCategoryDetail(id) },
                            onOpenInTree = { id ->
                                viewModel.setTreeFocusRoot(id)
                                viewModel.navigateTo(WorkspaceRoute.TREE)
                            },
                            onCreateNode = { nameAr, nameEn, desc, slug, nodeType, parentId ->
                                viewModel.saveNode(
                                    id = null,
                                    nameAr = nameAr,
                                    nameEn = nameEn,
                                    description = desc,
                                    slugInput = slug,
                                    nodeType = nodeType,
                                    parentId = parentId,
                                    imagePath = null,
                                    sortOrder = uiState.nodes.size + 1,
                                    status = com.ycp.taxonomyplanner.domain.RecordStatus.ACTIVE
                                )
                            }
                        )

                        WorkspaceRoute.TREE -> TreeWorkspaceScreen(
                            uiState = uiState,
                            getAncestors = { id -> viewModel.repository.getAncestors(id, uiState.nodes) },
                            getDisqualifiedParentIds = { id, nt ->
                                viewModel.repository.getDisqualifiedParentIds(id, nt, uiState.nodes)
                            },
                            onFocusRootChange = { viewModel.setTreeFocusRoot(it) },
                            onOpenFullDetails = { id -> viewModel.openCategoryDetail(id) },
                            onSaveNode = { id, nameAr, nameEn, desc, slug, nodeType, parentId, sortOrder, status ->
                                viewModel.saveNode(
                                    id = id,
                                    nameAr = nameAr,
                                    nameEn = nameEn,
                                    description = desc,
                                    slugInput = slug,
                                    nodeType = nodeType,
                                    parentId = parentId,
                                    imagePath = null,
                                    sortOrder = sortOrder,
                                    status = status
                                )
                            },
                            onArchiveOrDeleteNode = { id -> viewModel.archiveOrDeleteNode(id) }
                        )

                        WorkspaceRoute.BROWSE -> StorefrontBrowseScreen(
                            uiState = uiState,
                            getAncestors = { id -> viewModel.repository.getAncestors(id, uiState.nodes) },
                            onSelectBrowseNode = { id -> viewModel.openBrowseNode(id) },
                            onOpenCategoryEditor = { id -> viewModel.openCategoryDetail(id) }
                        )

                        WorkspaceRoute.CATEGORY_DETAIL -> CategoryDetailScreen(
                            uiState = uiState,
                            categoryId = uiState.selectedCategoryId ?: uiState.nodes.firstOrNull()?.id.orEmpty(),
                            getFullPathAr = { id -> viewModel.repository.getFullPathAr(id, uiState.nodes) },
                            getDisqualifiedParentIds = { id, nt ->
                                viewModel.repository.getDisqualifiedParentIds(id, nt, uiState.nodes)
                            },
                            onNavigateBack = { viewModel.navigateBack() },
                            onOpenInStorefront = { id -> viewModel.openBrowseNode(id) },
                            onSaveNode = { id, nameAr, nameEn, desc, slug, nodeType, parentId, imagePath, sortOrder, status ->
                                viewModel.saveNode(
                                    id = id,
                                    nameAr = nameAr,
                                    nameEn = nameEn,
                                    description = desc,
                                    slugInput = slug,
                                    nodeType = nodeType,
                                    parentId = parentId,
                                    imagePath = imagePath,
                                    sortOrder = sortOrder,
                                    status = status
                                )
                            },
                            onSaveBinding = { id, ptId, attrId, roleKey, groupName, req, filt, variant, minV, maxV, unitId, vsetId, allowedVals, order ->
                                viewModel.saveProductTypeBinding(
                                    id, ptId, attrId, roleKey, groupName, req, filt, variant,
                                    minV, maxV, unitId, vsetId, allowedVals, order
                                )
                            },
                            onRemoveBinding = { id -> viewModel.removeProductTypeBinding(id) }
                        )

                        WorkspaceRoute.DEFINITIONS_HUB -> DefinitionsHubScreen(
                            uiState = uiState,
                            onNavigate = { viewModel.navigateTo(it) }
                        )

                        WorkspaceRoute.ATTRIBUTES_CENTER -> AttributesCenterScreen(
                            uiState = uiState,
                            onBackToHub = { viewModel.navigateTo(WorkspaceRoute.DEFINITIONS_HUB) },
                            onOpenDataTypes = { viewModel.navigateTo(WorkspaceRoute.DATA_TYPES_CENTER) },
                            onSaveAttribute = { id, key, nameAr, nameEn, dt, ft, dimId, aliases, st ->
                                viewModel.saveAttributeDefinition(
                                    id, key, nameAr, nameEn, dt, ft, dimId, aliases, st
                                )
                            }
                        )

                        WorkspaceRoute.DATA_TYPES_CENTER -> DataTypesCenterScreen(
                            onBackToHub = { viewModel.navigateTo(WorkspaceRoute.DEFINITIONS_HUB) },
                            onOpenAttributes = { viewModel.navigateTo(WorkspaceRoute.ATTRIBUTES_CENTER) }
                        )

                        WorkspaceRoute.VALUE_SETS_CENTER -> ValueSetsCenterScreen(
                            uiState = uiState,
                            onBackToHub = { viewModel.navigateTo(WorkspaceRoute.DEFINITIONS_HUB) },
                            onSaveValueSet = { id, key, nameAr, nameEn, attrId, st ->
                                viewModel.saveValueSet(id, key, nameAr, nameEn, attrId, st)
                            },
                            onSaveAttributeValue = { id, setId, key, labelAr, labelEn, rawVal, order, st ->
                                viewModel.saveAttributeValue(id, setId, key, labelAr, labelEn, rawVal, order, st)
                            }
                        )

                        WorkspaceRoute.MEASUREMENTS_CENTER -> MeasurementsAndConversionsScreen(
                            uiState = uiState,
                            initialTabIsConversions = false,
                            onBackToHub = { viewModel.navigateTo(WorkspaceRoute.DEFINITIONS_HUB) },
                            onSaveDimension = { id, key, nameAr, nameEn, bKey, bName, bSym ->
                                viewModel.saveDimension(id, key, nameAr, nameEn, bKey, bName, bSym)
                            },
                            onSaveUnit = { id, dimId, key, nameAr, nameEn, sym, mult, off, st ->
                                viewModel.saveMeasurementUnit(id, dimId, key, nameAr, nameEn, sym, mult, off, st)
                            },
                            onRebaseUnit = { unitId -> viewModel.rebaseBaseUnit(unitId) },
                            onSaveConversionRule = { src, dst -> viewModel.saveConversionRule(src, dst) },
                            onDeleteConversionRule = { id -> viewModel.deleteConversionRule(id) }
                        )

                        WorkspaceRoute.UNIT_CONVERSIONS_CENTER -> MeasurementsAndConversionsScreen(
                            uiState = uiState,
                            initialTabIsConversions = true,
                            onBackToHub = { viewModel.navigateTo(WorkspaceRoute.DEFINITIONS_HUB) },
                            onSaveDimension = { id, key, nameAr, nameEn, bKey, bName, bSym ->
                                viewModel.saveDimension(id, key, nameAr, nameEn, bKey, bName, bSym)
                            },
                            onSaveUnit = { id, dimId, key, nameAr, nameEn, sym, mult, off, st ->
                                viewModel.saveMeasurementUnit(id, dimId, key, nameAr, nameEn, sym, mult, off, st)
                            },
                            onRebaseUnit = { unitId -> viewModel.rebaseBaseUnit(unitId) },
                            onSaveConversionRule = { src, dst -> viewModel.saveConversionRule(src, dst) },
                            onDeleteConversionRule = { id -> viewModel.deleteConversionRule(id) }
                        )
                    }
                }
            }
        }
    }

    if (uiState.isSpotlightOpen) {
        SpotlightSearchDialog(
            nodes = uiState.nodes,
            attributes = uiState.attributes,
            getFullPathAr = { id -> viewModel.repository.getFullPathAr(id, uiState.nodes) },
            onSelectNode = { id -> viewModel.openCategoryDetail(id) },
            onSelectAttributeCenter = { viewModel.navigateTo(WorkspaceRoute.ATTRIBUTES_CENTER) },
            onDismiss = { viewModel.setSpotlightOpen(false) }
        )
    }

    if (uiState.isExportDialogOpen) {
        ExportCatalogDialog(
            jsonContent = uiState.exportedJsonPreview,
            onDismiss = { viewModel.closeExportDialog() },
            onCopied = {
                viewModel.showMessage("تم نسخ JSON المثرى إلى الحافظة.")
            }
        )
    }

    if (uiState.isSyncDialogOpen) {
        CloudSyncAndOwnerDialog(
            isOwnerUnlocked = uiState.isOwnerUnlocked,
            supabaseConfigured = uiState.supabaseConfigured,
            signedInEmail = uiState.signedInOwnerEmail,
            isSyncing = uiState.isSyncing,
            onToggleOwnerLock = { viewModel.toggleOwnerLock() },
            onSignInOwner = { email, password -> viewModel.signInSupabaseOwner(email, password) },
            onSignOutOwner = { viewModel.signOutSupabaseOwner() },
            onTriggerSync = { viewModel.syncWithSupabase() },
            onDismiss = { viewModel.setSyncDialogOpen(false) }
        )
    }
}
