package com.onevertix.easytransferagent.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.onevertix.easytransferagent.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    state: AuthUiState.PhoneEntry,
    onPhoneChange: (String) -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.login_title)) })
        }
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = stringResource(R.string.login_desc),
                style = MaterialTheme.typography.titleMedium
            )

            OutlinedTextField(
                value = state.phone,
                onValueChange = { input ->
                    // Only allow digits and format as 09XXXXXXXX
                    val digitsOnly = input.filter { it.isDigit() }
                    // Limit to 10 digits (09 + 8 digits)
                    val formatted = digitsOnly.take(10)
                    onPhoneChange(formatted)
                },
                label = { Text(stringResource(R.string.phone_label)) },
                leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                isError = state.phoneError != null,
                supportingText = state.phoneError?.let { { Text(it) } },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                placeholder = { Text(stringResource(R.string.phone_hint)) },
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = onSubmit,
                enabled = !state.isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary)
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.sending))
                } else {
                    Icon(Icons.Default.Check, contentDescription = stringResource(R.string.icon_check))
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.send_otp))
                }
            }
        }
    }
}
