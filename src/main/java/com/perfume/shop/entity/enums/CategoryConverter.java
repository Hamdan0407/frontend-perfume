package com.perfume.shop.entity.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class CategoryConverter implements AttributeConverter<Category, String> {

    @Override
    public String convertToDatabaseColumn(Category category) {
        if (category == null) {
            return null;
        }
        return category.name();
    }

    @Override
    public Category convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return Category.fromString(dbData);
    }
}
