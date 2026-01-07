package com.webshield.api.controller;

import com.webshield.api.model.Domain;
import com.webshield.api.service.DomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/domains")
@CrossOrigin(origins = "*") // Allow access from extension
public class DomainController {

    @Autowired
    private DomainService domainService;

    @GetMapping
    public List<Domain> getAllDomains() {
        return domainService.getAllDomains();
    }

    @GetMapping("/sync")
    public List<Domain> syncDomains(
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime lastSync) {
        
        if (lastSync == null) {
            return domainService.getAllDomains();
        }
        return domainService.getDomainsSince(lastSync);
    }

    @PostMapping
    public ResponseEntity<Domain> addDomain(@RequestBody Domain domain) {
        return ResponseEntity.ok(domainService.addDomain(domain));
    }
}
