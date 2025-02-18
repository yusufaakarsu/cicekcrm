```mermaid
erDiagram
    TENANT ||--o{ USER : has
    TENANT ||--o{ SUBSCRIPTION : has
    USER ||--o{ AUDIT_LOG : creates
    TENANT ||--o{ CUSTOMER : owns
    TENANT ||--o{ PRODUCT : owns

    PRODUCT }|--|| PRODUCT_TYPE : has
    PRODUCT }|--|| PRODUCT_CATEGORY : belongs_to
    PRODUCT ||--o{ STOCK_MOVEMENT : has
    PRODUCT ||--o{ RECIPE : has
    PRODUCT }|--|| STOCK_UNIT : measured_in
    PRODUCT }o--|| SUPPLIER : preferred_by

    RECIPE ||--|{ RECIPE_ITEM : contains
    RECIPE }|--|| PRODUCT : belongs_to
    RECIPE }|--|| RECIPE_CATEGORY : categorized_in
    RECIPE_ITEM }|--|| PRODUCT : uses
    RECIPE_ITEM }|--|| STOCK_UNIT : measured_in
    RECIPE ||--o{ RECIPE_COST : tracks

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER }|--|| CUSTOMER : placed_by
    ORDER }|--|| ADDRESS : delivered_to
    ORDER_ITEM }|--|| PRODUCT : references
    ORDER_ITEM ||--o{ ORDER_RECIPE : has
    ORDER_RECIPE ||--|{ ORDER_RECIPE_ITEM : contains

    SUPPLIER ||--o{ PURCHASE_ORDER : receives
    PURCHASE_ORDER ||--|{ PURCHASE_ORDER_ITEM : contains
    PURCHASE_ORDER_ITEM }|--|| PRODUCT : references
    INVENTORY_COUNT ||--|{ INVENTORY_COUNT_ITEM : contains
    INVENTORY_COUNT_ITEM }|--|| PRODUCT : counts
    STOCK_MOVEMENT }|--|| PRODUCT : affects
```