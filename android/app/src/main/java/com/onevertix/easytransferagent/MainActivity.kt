package com.onevertix.easytransferagent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
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
import com.onevertix.easytransferagent.ui.setup.*
import com.onevertix.easytransferagent.ui.theme.EasyTransferAgentTheme

class MainActivity : ComponentActivity() {

    private val permissionsViewModel: PermissionsViewModel by viewModels()
    private val serverSetupViewModel: ServerSetupViewModel by viewModels()
    private val configViewModel: ConfigViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize view models
        serverSetupViewModel.initialize(this)
        configViewModel.initialize(this)

        val config = resources.configuration
        config.setLayoutDirection(java.util.Locale("ar"))

        setContent {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                EasyTransferAgentTheme {
                    Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                        MainContent(
                            modifier = Modifier.padding(innerPadding),
                            permissionsViewModel = permissionsViewModel,
                            serverSetupViewModel = serverSetupViewModel,
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
    serverSetupViewModel: ServerSetupViewModel,
    configViewModel: ConfigViewModel,
    onRequestPermissions: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val permissionsState by permissionsViewModel.uiState.collectAsState()
    val serverSetupState by serverSetupViewModel.uiState.collectAsState()
    val configState by configViewModel.uiState.collectAsState()

    // Create AuthViewModel with repository
    val context = androidx.compose.ui.platform.LocalContext.current
    val authRepo = remember {
        DefaultAuthRepository(LocalPreferences(context), SecureStorage(context))
    }
    val authViewModel = remember { AuthViewModel(authRepo, context) }

    // Determine initial screen based on app state
    val localPrefs = remember { LocalPreferences(context) }
    val initialScreen = remember {
        val secure = SecureStorage(context)
        val hasPassword = secure.getUssdPassword() != null
        val hasSimConfig = localPrefs.getSim1Operator() != null || localPrefs.getSim2Operator() != null
        when {
            authRepo.isLoggedIn() && hasSimConfig && hasPassword -> AppScreen.DASHBOARD
            authRepo.isLoggedIn() && (!hasSimConfig || !hasPassword) -> AppScreen.CONFIGURATION
            localPrefs.isSetupComplete() -> AppScreen.AUTH_LOGIN
            localPrefs.getServerUrl() != null -> AppScreen.CONFIGURATION // fallback if server URL set but not setup complete
            else -> AppScreen.PERMISSIONS
        }
    }

    var currentScreen by remember { mutableStateOf(initialScreen) }

    // Check existing auth on start
    LaunchedEffect(Unit) {
        authViewModel.checkExistingAuth()
    }

    // Navigation rules - follow strict sequence
    LaunchedEffect(permissionsState) {
        if (permissionsState is PermissionsUiState.Granted) {
            // After permissions granted, go to server setup
            currentScreen = AppScreen.SERVER_SETUP
        }
    }

    LaunchedEffect(serverSetupState) {
        when (serverSetupState) {
            is ServerSetupUiState.Success -> {
                // Server configured, move to login
                currentScreen = AppScreen.AUTH_LOGIN
            }
            else -> {
                // Server not configured yet, stay on SERVER_SETUP
            }
        }
    }

    // Observe auth state to navigate
    val authState by authViewModel.uiState.collectAsState()
    LaunchedEffect(authState) {
        when (authState) {
            is AuthUiState.Authenticated -> {
                val secure = SecureStorage(context)
                val hasPassword = secure.getUssdPassword() != null
                val hasSimConfig = localPrefs.getSim1Operator() != null || localPrefs.getSim2Operator() != null
                currentScreen = if (hasPassword && hasSimConfig) AppScreen.DASHBOARD else AppScreen.CONFIGURATION
            }
            is AuthUiState.OtpEntry -> {
                if (currentScreen == AppScreen.AUTH_LOGIN) {
                    currentScreen = AppScreen.AUTH_OTP
                }
            }
            is AuthUiState.PhoneEntry -> { /* stay */ }
        }
    }

    LaunchedEffect(configState) {
        if (configState is ConfigUiState.Success) {
            val secure = SecureStorage(context)
            val hasPassword = secure.getUssdPassword() != null
            val hasSimConfig = localPrefs.getSim1Operator() != null || localPrefs.getSim2Operator() != null
            currentScreen = if (hasPassword && hasSimConfig) AppScreen.DASHBOARD else AppScreen.CONFIGURATION
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
        AppScreen.SERVER_SETUP -> {
            when (val state = serverSetupState) {
                is ServerSetupUiState.Loading -> ServerSetupLoadingScreen(modifier)
                is ServerSetupUiState.Editing -> ServerSetupScreen(
                    modifier = modifier,
                    state = state,
                    onUrlChange = serverSetupViewModel::updateServerUrl,
                    onTestConnection = serverSetupViewModel::testConnection
                )
                is ServerSetupUiState.Success -> ServerSetupSuccessScreen(
                    modifier = modifier,
                    serverUrl = state.serverUrl,
                    onContinue = {
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
                is AuthUiState.Authenticated -> {
                    // Show loading while transitioning to configuration
                    Box(
                        modifier = modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
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
                is AuthUiState.Authenticated -> {
                    // Show loading while transitioning to configuration
                    Box(
                        modifier = modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
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
                        currentScreen = AppScreen.DASHBOARD
                    }
                )
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
                    viewModel = dashboardViewModel,
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

/**
 * App screen navigation enum
 * Flow: PERMISSIONS → SERVER_SETUP → AUTH_LOGIN → AUTH_OTP → CONFIGURATION → DASHBOARD
 */
private enum class AppScreen {
    PERMISSIONS,
    SERVER_SETUP,
    AUTH_LOGIN,
    AUTH_OTP,
    CONFIGURATION,
    DASHBOARD
}
