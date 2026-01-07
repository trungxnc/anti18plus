package com.webshield.api.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "domains")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Domain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String domainName;

    @Enumerated(EnumType.STRING)
    private DomainCategory category;

    private String source; // e.g., "System", "Community", "User-Reported"
    
    private boolean isActive = true;

    private LocalDateTime addedAt = LocalDateTime.now();

    public enum DomainCategory {
        ADULT,
        GAMBLING,
        MALWARE,
        OTHER
    }
}
