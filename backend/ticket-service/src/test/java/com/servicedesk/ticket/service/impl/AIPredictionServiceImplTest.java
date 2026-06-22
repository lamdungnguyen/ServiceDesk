package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AIAccuracyStatsDto;
import com.servicedesk.ticket.repository.AIPredictionRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AIPredictionServiceImplTest {

    @Test
    void getAccuracyStatsCountsCategoryAndPriorityIndependently() {
        AIPredictionRepository repository = mock(AIPredictionRepository.class);
        AIPredictionServiceImpl service = new AIPredictionServiceImpl(repository);

        when(repository.getCategoryAccuracyStats()).thenReturn(List.<Object[]>of(
                new Object[]{"NETWORK", 2L, 1L}
        ));
        when(repository.getPriorityAccuracyStats()).thenReturn(List.<Object[]>of(
                new Object[]{"HIGH", 2L, 1L}
        ));
        when(repository.getSourceAccuracyStats()).thenReturn(List.<Object[]>of(
                new Object[]{"RULE_BASED", 2L, 1L}
        ));
        when(repository.countVerifiedPredictions()).thenReturn(2L);
        when(repository.countCorrectedPredictions()).thenReturn(2L);
        when(repository.countFullyCorrectPredictions()).thenReturn(0L);

        AIAccuracyStatsDto stats = service.getAccuracyStats();

        assertThat(stats.getCategoryAccuracy()).containsEntry("NETWORK", 50.0);
        assertThat(stats.getPriorityAccuracy()).containsEntry("HIGH", 50.0);
        assertThat(stats.getSourceAccuracy()).containsEntry("RULE_BASED", 50.0);
        assertThat(stats.getTotalVerified()).isEqualTo(2L);
        assertThat(stats.getTotalCorrected()).isEqualTo(2L);
        assertThat(stats.getTotalCorrect()).isEqualTo(0L);
    }
}
