package com.webshield.api.config;

import com.webshield.api.model.Domain;
import com.webshield.api.service.DomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private DomainService domainService;

    @Override
    public void run(String... args) throws Exception {
        if (domainService.getAllDomains().isEmpty()) {
            System.out.println("Seeding initial data...");
            
            domainService.addDomain(new Domain(null, "example-porn.com", Domain.DomainCategory.ADULT, "System", true, null));
            domainService.addDomain(new Domain(null, "online-casino-test.com", Domain.DomainCategory.GAMBLING, "System", true, null));
            domainService.addDomain(new Domain(null, "malware-site.net", Domain.DomainCategory.MALWARE, "System", true, null));
            
            System.out.println("Data seeding completed.");
        }
    }
}
