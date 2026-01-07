package com.webshield.api.repository;

import com.webshield.api.model.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DomainRepository extends JpaRepository<Domain, Long> {
    Optional<Domain> findByDomainName(String domainName);
    
    // Find domains added after a certain timestamp for synchronization
    List<Domain> findByAddedAtAfter(LocalDateTime timestamp);
}
