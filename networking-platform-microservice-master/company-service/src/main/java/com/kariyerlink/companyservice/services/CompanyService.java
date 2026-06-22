package com.kariyerlink.companyservice.services;

import com.kariyerlink.companyservice.client.UserClient;
import com.kariyerlink.companyservice.dtos.CompanyRequest;
import com.kariyerlink.companyservice.dtos.CompanyResponse;
import com.kariyerlink.companyservice.dtos.UserResponse;
import com.kariyerlink.companyservice.exceptions.CompanyNotFoundException;
import com.kariyerlink.companyservice.exceptions.FetchException;
import com.kariyerlink.companyservice.mappers.CompanyMapper;
import com.kariyerlink.companyservice.models.Company;
import com.kariyerlink.companyservice.repositories.CompanyRepository;
import feign.FeignException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
public class CompanyService {
    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;
    private final UserClient userClient;
    public CompanyService(CompanyRepository companyRepository,
                          CompanyMapper companyMapper,UserClient userClient){
        this.companyRepository = companyRepository;
        this.companyMapper = companyMapper;
        this.userClient = userClient;
    }
    public void add(CompanyRequest companyRequest){
        Company company = this.companyMapper.requestToComponent(companyRequest);
        this.companyRepository.save(company);
    }

    public void delete(UUID id){
        this.companyRepository.deleteById(id);

    }

    public CompanyResponse getById(UUID id){
        Company company = this.companyRepository.findById(id).
                orElseThrow(()-> new CompanyNotFoundException());
        if (company.getOwnerId() != null) {
            UserResponse userResponse = userClient.getUserById(company.getOwnerId());
            return this.companyMapper.companyToResponse(company, userResponse);
        }
        return new CompanyResponse(
                company.getId(), null,
                company.getName(), company.getDescription(),
                "", "",
                company.getAddress(), company.getEmail(), company.getWebsite()
        );
    }

    public List<CompanyResponse> getAll(){
        try {
            List<Company> companyList = this.companyRepository.findAll();
            return companyList.stream().map(company -> {
                UserResponse userResponse = userClient.getUserById(company.getOwnerId());
                return this.companyMapper.companyToResponse(company,userResponse);
            }).collect(Collectors.toList());
        }catch (FeignException e){
            throw new FetchException();
        }
    }

    public List<CompanyResponse> getAllByOwner(UUID ownerId){
        try {
            UserResponse userResponse = this.userClient.getUserById(ownerId);
            List<Company> companyList = this.companyRepository.findByOwnerId(ownerId);
            return companyList.stream().map(company ->
                    this.companyMapper.companyToResponse(company,userResponse)
            ).collect(Collectors.toList());
        }catch (FeignException e){
            throw new FetchException();
        }
    }


}
