package com.firetree.heritage.features.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductPurchaseRequest(
    @NotNull @Min(1) Integer quantity,
    @Size(max = 200, message = "address is too long") String address,
    @Size(max = 64, message = "contactName is too long") String contactName,
    @Size(max = 32, message = "contactPhone is too long") String contactPhone
) {
}
