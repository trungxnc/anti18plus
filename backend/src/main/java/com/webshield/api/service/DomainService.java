package com.webshield.api.service;

import com.webshield.api.model.Domain;
import com.webshield.api.repository.DomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DomainService {

    @Autowired
    private DomainRepository domainRepository;

    public List<Domain> getAllDomains() {
        return domainRepository.findAll();
    }

    public List<Domain> getDomainsSince(LocalDateTime since) {
        return domainRepository.findByAddedAtAfter(since);
    }

    public Domain addDomain(Domain domain) {
        if (domainRepository.findByDomainName(domain.getDomainName()).isPresent()) {
            throw new RuntimeException("Domain already exists");
        }
        domain.setAddedAt(LocalDateTime.now());
        return domainRepository.save(domain);
    }
}
