package com.onevertix.easytransferagent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.onevertix.easytransferagent.ui.permissions.PermissionsGrantedScreen
import com.onevertix.easytransferagent.ui.permissions.PermissionsLoadingScreen
import com.onevertix.easytransferagent.ui.permissions.PermissionsScreen
import com.onevertix.easytransferagent.ui.permissions.PermissionsUiState
import com.onevertix.easytransferagent.ui.permissions.PermissionsViewModel
import com.onevertix.easytransferagent.ui.theme.EasyTransferAgentTheme

class MainActivity : ComponentActivity() {

    private val permissionsViewModel: PermissionsViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            EasyTransferAgentTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    MainContent(
                        modifier = Modifier.padding(innerPadding),
                        viewModel = permissionsViewModel,
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
    viewModel: PermissionsViewModel,
    onRequestPermissions: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    when (val state = uiState) {
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
            // TODO: Navigate to next screen (configuration or login)
            // For now, show success screen
            PermissionsGrantedScreen(
                modifier = modifier,
                onContinue = {
                    // TODO: Navigate to configuration/login screen
                }
            )
        }
    }
}

