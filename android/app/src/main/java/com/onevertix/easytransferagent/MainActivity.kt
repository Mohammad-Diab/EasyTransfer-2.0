package com.onevertix.easytransferagent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.onevertix.easytransferagent.data.storage.LocalPreferences
import com.onevertix.easytransferagent.ui.config.*
import com.onevertix.easytransferagent.ui.permissions.PermissionsLoadingScreen
import com.onevertix.easytransferagent.ui.permissions.PermissionsScreen
import com.onevertix.easytransferagent.ui.permissions.PermissionsUiState
import com.onevertix.easytransferagent.ui.permissions.PermissionsViewModel
import com.onevertix.easytransferagent.ui.theme.EasyTransferAgentTheme

class MainActivity : ComponentActivity() {

    private val permissionsViewModel: PermissionsViewModel by viewModels()
    private val configViewModel: ConfigViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize config view model
        configViewModel.initialize(this)

        setContent {
            EasyTransferAgentTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    MainContent(
                        modifier = Modifier.padding(innerPadding),
                        permissionsViewModel = permissionsViewModel,
                        configViewModel = configViewModel,
                        onRequestPermissions = {
                            permissionsViewModel.requestPermissions(this)
                        },
                        onOpenSettings = {
                            permissionsViewModel.openAppSettings(this)
                        }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Check permissions when activity resumes (e.g., returning from settings)
        permissionsViewModel.checkPermissions(this)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        permissionsViewModel.handlePermissionResult(this, requestCode, permissions, grantResults)
    }
}

@Composable
fun MainContent(
    modifier: Modifier = Modifier,
    permissionsViewModel: PermissionsViewModel,
    configViewModel: ConfigViewModel,
    onRequestPermissions: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val permissionsState by permissionsViewModel.uiState.collectAsState()
    val configState by configViewModel.uiState.collectAsState()

    var currentScreen by remember { mutableStateOf(AppScreen.PERMISSIONS) }

    // Navigate based on state
    LaunchedEffect(permissionsState) {
        if (permissionsState is PermissionsUiState.Granted) {
            currentScreen = AppScreen.CONFIGURATION
        }
    }

    LaunchedEffect(configState) {
        if (configState is ConfigUiState.Success) {
            currentScreen = AppScreen.LOGIN
        }
    }

    when (currentScreen) {
        AppScreen.PERMISSIONS -> {
            when (val state = permissionsState) {
                is PermissionsUiState.Loading -> {
                    PermissionsLoadingScreen(modifier = modifier)
                }

                is PermissionsUiState.Required -> {
                    PermissionsScreen(
                        modifier = modifier,
                        missingPermissions = state.missingPermissions,
                        onRequestPermissions = onRequestPermissions,
                        onOpenSettings = onOpenSettings,
                        showSettingsButton = state.showSettingsButton
                    )
                }

                is PermissionsUiState.Granted -> {
                    // Will navigate to config automatically
                    PermissionsLoadingScreen(modifier = modifier)
                }
            }
        }

        AppScreen.CONFIGURATION -> {
            when (val state = configState) {
                is ConfigUiState.Loading -> {
                    ConfigLoadingScreen(modifier = modifier)
                }

                is ConfigUiState.Editing -> {
                    ConfigScreen(
                        modifier = modifier,
                        uiState = state,
                        onServerUrlChange = configViewModel::updateServerUrl,
                        onSim1OperatorChange = configViewModel::updateSim1Operator,
                        onSim2OperatorChange = configViewModel::updateSim2Operator,
                        onUssdPasswordChange = configViewModel::updateUssdPassword,
                        onSaveClick = configViewModel::saveConfiguration
                    )
                }

                is ConfigUiState.Success -> {
                    ConfigSuccessScreen(
                        modifier = modifier,
                        onContinue = {
                            // TODO: Navigate to login/authentication screen
                            currentScreen = AppScreen.LOGIN
                        }
                    )
                }
            }
        }

        AppScreen.LOGIN -> {
            // TODO: Implement login screen
            // For now, show a placeholder
            ConfigSuccessScreen(
                modifier = modifier,
                onContinue = {
                    // Placeholder
                }
            )
        }
    }
}

/**
 * App screen navigation enum
 */
private enum class AppScreen {
    PERMISSIONS,
    CONFIGURATION,
    LOGIN
}

