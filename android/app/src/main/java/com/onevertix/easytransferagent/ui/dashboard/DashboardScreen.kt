package com.onevertix.easytransferagent.ui.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.onevertix.easytransferagent.R
import com.onevertix.easytransferagent.data.models.TransferStats
import java.text.ParsePosition
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    state: DashboardUiState.Ready,
    viewModel: DashboardViewModel,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val stats by viewModel.stats.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.dashboard_title)) },
//                actions = {
//                    IconButton(onClick = onLogout) {
//                        Icon(Icons.Default.Close, contentDescription = stringResource(R.string.logout))
//                    }
//                }
            )
        }
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Mock Mode Indicator (Debug builds only)
            if (com.onevertix.easytransferagent.ussd.MockUssdService.isEnabled()) {
                MockModeIndicator()
            }

            // Connection Status Indicator
            ConnectionStatusCard(stats = stats)

            // Service Control Card
            ServiceStatusCard(
                isRunning = state.serviceRunning,
                onStartService = onStartService,
                onStopService = onStopService
            )

            // Statistics Cards
            // StatsOverviewCard(stats = stats)

            // Pending Jobs Card
            if (stats.pendingJobsCount > 0) {
                PendingJobsCard(count = stats.pendingJobsCount)
            }

            Spacer(modifier = Modifier.weight(1f))

            // Authentication Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (state.isLoggedIn) Icons.Default.CheckCircle else Icons.Default.Warning,
                    contentDescription = if (state.isLoggedIn) stringResource(R.string.icon_check_circle) else stringResource(R.string.icon_warning),
                    tint = if (state.isLoggedIn) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (state.isLoggedIn) stringResource(R.string.authenticated) else stringResource(R.string.not_authenticated),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
private fun ConnectionStatusCard(
    stats: TransferStats,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (stats.connected)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (stats.connected) Icons.Default.CheckCircle else Icons.Default.Warning,
                    contentDescription = if (stats.connected) stringResource(R.string.icon_check_circle) else stringResource(R.string.icon_warning),
                    tint = if (stats.connected)
                        MaterialTheme.colorScheme.primary
                    else
                        MaterialTheme.colorScheme.error
                )
                Text(
                    text = if (stats.connected) stringResource(R.string.connected) else stringResource(R.string.disconnected),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            if (stats.lastTransferTime != null) {
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = stringResource(R.string.last_transfer),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = formatTimestamp(stats.lastTransferTime),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun ServiceStatusCard(
    isRunning: Boolean,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isRunning)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = if (isRunning) Icons.Default.PlayArrow else Icons.Default.Settings,
                    contentDescription = if (isRunning) stringResource(R.string.icon_play) else stringResource(R.string.icon_settings),
                    tint = if (isRunning) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = stringResource(R.string.transfer_service),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Text(
                text = if (isRunning) stringResource(R.string.service_running) else stringResource(R.string.service_stopped),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (isRunning) {
                Button(
                    onClick = onStopService,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(Icons.Default.Close, contentDescription = stringResource(R.string.icon_close))
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.stop_service))
                }
            } else {
                Button(
                    onClick = onStartService,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = stringResource(R.string.icon_play))
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.start_service))
                }
            }
        }
    }
}

@Composable
private fun StatsOverviewCard(
    stats: TransferStats,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = stringResource(R.string.icon_info),
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = stringResource(R.string.statistics),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            // Today's stats
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = stringResource(R.string.today),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = stringResource(R.string.transfers_count, stats.todayCount),
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${stats.todaySuccess}",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = stringResource(R.string.success),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${stats.todayFailed}",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = stringResource(R.string.failed),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Overall stats
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(stringResource(R.string.this_week), "${stats.weekCount}")
                StatItem(stringResource(R.string.total), "${stats.totalCount}")
            }
        }
    }
}

@Composable
private fun PendingJobsCard(
    count: Int,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.List,
                    contentDescription = stringResource(R.string.icon_list),
                    tint = MaterialTheme.colorScheme.tertiary
                )
                Text(
                    text = stringResource(R.string.pending_jobs),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Text(
                text = "$count",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.tertiary
            )
        }
    }
}

@Composable
private fun MockModeIndicator(
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = stringResource(R.string.icon_warning),
                tint = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.size(24.dp)
            )
            Column {
                Text(
                    text = "🧪 MOCK USSD MODE",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.tertiary
                )
                Text(
                    text = "Using simulated USSD responses (${com.onevertix.easytransferagent.ussd.MockUssdService.getDelayMs()}ms delay)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// Helper non-composable time bucket computation
private enum class TimeBucket { JUST_NOW, MINUTES, HOURS, DAYS, RECENTLY }

private fun computeTimeBucket(iso8601: String): Pair<TimeBucket, Int> {
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    val pos = ParsePosition(0)
    val date = sdf.parse(iso8601, pos)
    val nowMs = System.currentTimeMillis()
    val thenMs = date?.time ?: nowMs
    val diff = nowMs - thenMs

    val minutes = (diff / 60_000L).toInt()
    val hours = (diff / 3_600_000L).toInt()
    val days = (diff / 86_400_000L).toInt()

    return when {
        minutes < 1 -> TimeBucket.JUST_NOW to 0
        minutes < 60 -> TimeBucket.MINUTES to minutes
        hours < 24 -> TimeBucket.HOURS to hours
        days >= 0 -> TimeBucket.DAYS to days
        else -> TimeBucket.RECENTLY to 0
    }
}

@Composable
private fun formatTimestamp(iso8601: String): String {
    val (bucket, value) = computeTimeBucket(iso8601)
    return when (bucket) {
        TimeBucket.JUST_NOW -> stringResource(R.string.just_now)
        TimeBucket.MINUTES -> stringResource(R.string.minutes_ago, value)
        TimeBucket.HOURS -> stringResource(R.string.hours_ago, value)
        TimeBucket.DAYS -> stringResource(R.string.days_ago, value)
        TimeBucket.RECENTLY -> stringResource(R.string.recently)
    }
}

@Composable
fun DashboardLoadingScreen(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

