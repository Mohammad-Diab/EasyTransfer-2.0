package com.onevertix.easytransferagent.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.onevertix.easytransferagent.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OtpScreen(
    state: AuthUiState.OtpEntry,
    onOtpChange: (String) -> Unit,
    onVerify: () -> Unit,
    onResend: () -> Unit,
    onEditPhone: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = { TopAppBar(title = { Text(stringResource(R.string.otp_title)) }) }
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                stringResource(R.string.otp_desc, state.phone),
                style = MaterialTheme.typography.titleMedium
            )

            OutlinedTextField(
                value = state.otp,
                onValueChange = onOtpChange,
                label = { Text(stringResource(R.string.otp_label)) },
                isError = state.otpError != null,
                supportingText = state.otpError?.let { { Text(it) } },
                singleLine = true,
                placeholder = { Text(stringResource(R.string.otp_hint)) },
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = onVerify,
                enabled = !state.isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary)
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.verifying))
                } else {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.verify_otp))
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(onClick = onEditPhone) {
                    Text(stringResource(R.string.edit_phone))
                }
                TextButton(onClick = onResend, enabled = state.resendSecondsLeft == 0) {
                    Icon(Icons.Default.Refresh, contentDescription = stringResource(R.string.icon_refresh))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        if (state.resendSecondsLeft == 0)
                            stringResource(R.string.resend_otp)
                        else
                            stringResource(R.string.resend_in, state.resendSecondsLeft)
                    )
                }
            }
        }
    }
}
