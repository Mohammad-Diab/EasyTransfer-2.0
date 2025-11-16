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
import com.onevertix.easytransferagent.data.storage.SecureStorage
import com.onevertix.easytransferagent.data.repository.DefaultAuthRepository
import com.onevertix.easytransferagent.services.TransferExecutorService
import com.onevertix.easytransferagent.ui.auth.*
import com.onevertix.easytransferagent.ui.config.*
import com.onevertix.easytransferagent.ui.dashboard.*
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

    // Create AuthViewModel with repository
    val context = androidx.compose.ui.platform.LocalContext.current
    val authRepo = remember {
        DefaultAuthRepository(LocalPreferences(context), SecureStorage(context))
    }
    val authViewModel = remember { AuthViewModel(authRepo) }

    var currentScreen by remember { mutableStateOf(AppScreen.PERMISSIONS) }

    // Navigation rules
    LaunchedEffect(permissionsState) {
        if (permissionsState is PermissionsUiState.Granted) {
            currentScreen = AppScreen.CONFIGURATION
        }
    }

    LaunchedEffect(configState) {
        if (configState is ConfigUiState.Success) {
            // After config saved, go to auth
            authViewModel.checkExistingAuth()
            currentScreen = AppScreen.AUTH_LOGIN
        }
    }

    // Observe auth state to navigate
    val authState by authViewModel.uiState.collectAsState()
    LaunchedEffect(authState) {
        when (authState) {
            is AuthUiState.Authenticated -> currentScreen = AppScreen.DASHBOARD
            is AuthUiState.PhoneEntry -> currentScreen = AppScreen.AUTH_LOGIN
            is AuthUiState.OtpEntry -> currentScreen = AppScreen.AUTH_OTP
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
                    PermissionsLoadingScreen(modifier = modifier)
                }
            }
        }
        AppScreen.CONFIGURATION -> {
            when (val state = configState) {
                is ConfigUiState.Loading -> ConfigLoadingScreen(modifier)
                is ConfigUiState.Editing -> ConfigScreen(
                    modifier = modifier,
                    uiState = state,
                    onServerUrlChange = configViewModel::updateServerUrl,
                    onSim1OperatorChange = configViewModel::updateSim1Operator,
                    onSim2OperatorChange = configViewModel::updateSim2Operator,
                    onUssdPasswordChange = configViewModel::updateUssdPassword,
                    onSaveClick = configViewModel::saveConfiguration
                )
                is ConfigUiState.Success -> ConfigSuccessScreen(
                    modifier = modifier,
                    onContinue = {
                        authViewModel.checkExistingAuth()
                        currentScreen = AppScreen.AUTH_LOGIN
                    }
                )
            }
        }
        AppScreen.AUTH_LOGIN -> {
            when (val st = authState) {
                is AuthUiState.PhoneEntry -> LoginScreen(
                    modifier = modifier,
                    state = st,
                    onPhoneChange = authViewModel::onPhoneChange,
                    onSubmit = authViewModel::submitPhone
                )
                is AuthUiState.OtpEntry -> { /* handled in AUTH_OTP */ }
                is AuthUiState.Authenticated -> DashboardPlaceholder(modifier)
            }
        }
        AppScreen.AUTH_OTP -> {
            when (val st = authState) {
                is AuthUiState.OtpEntry -> OtpScreen(
                    modifier = modifier,
                    state = st,
                    onOtpChange = authViewModel::onOtpChange,
                    onVerify = authViewModel::submitOtp,
                    onResend = authViewModel::resendOtp,
                    onEditPhone = authViewModel::backToPhone
                )
                is AuthUiState.PhoneEntry -> LoginScreen(
                    modifier = modifier,
                    state = st,
                    onPhoneChange = authViewModel::onPhoneChange,
                    onSubmit = authViewModel::submitPhone
                )
                is AuthUiState.Authenticated -> DashboardPlaceholder(modifier)
            }
        }
        AppScreen.DASHBOARD -> {
            val dashboardRepo = remember {
                DefaultAuthRepository(LocalPreferences(context), SecureStorage(context))
            }
            val dashboardViewModel = remember { DashboardViewModel(dashboardRepo) }
            val dashboardState by dashboardViewModel.uiState.collectAsState()

            when (val st = dashboardState) {
                is DashboardUiState.Loading -> DashboardLoadingScreen(modifier)
                is DashboardUiState.Ready -> DashboardScreen(
                    modifier = modifier,
                    state = st,
                    onStartService = {
                        TransferExecutorService.start(context)
                        dashboardViewModel.startService()
                    },
                    onStopService = {
                        TransferExecutorService.stop(context)
                        dashboardViewModel.stopService()
                    },
                    onLogout = {
                        TransferExecutorService.stop(context)
                        dashboardViewModel.logout()
                        currentScreen = AppScreen.AUTH_LOGIN
                    }
                )
                is DashboardUiState.LoggedOut -> {
                    // Return to login
                    LaunchedEffect(Unit) {
                        currentScreen = AppScreen.AUTH_LOGIN
                    }
                }
            }
        }
    }
}

@Composable
private fun DashboardPlaceholder(modifier: Modifier = Modifier) {
    androidx.compose.foundation.layout.Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = androidx.compose.ui.Alignment.Center
    ) {
        androidx.compose.material3.Text(text = "Logged in! Dashboard coming soon")
    }
}

/**
 * App screen navigation enum
 */
private enum class AppScreen {
    PERMISSIONS,
    CONFIGURATION,
    AUTH_LOGIN,
    AUTH_OTP,
    DASHBOARD
}
