graph TD
    A[Telefon Numarası Gir] --> B{Müşteri Var mı?}
    
    B -->|Evet| C[Müşteri Bilgilerini Göster]
    B -->|Hayır| D[Yeni Müşteri Formu]
    
    C --> E[Kayıtlı Adresleri Listele]
    D --> F[Müşteri Bilgilerini Kaydet]
    
    E --> G{Adres Seç}
    F --> H[Yeni Adres Ekle]
    
    G -->|Kayıtlı Adres| I[Adresi Onayla]
    G -->|Yeni Adres| H
    
    H --> I
    
    I --> J[Teslimat Bilgileri Formu]
    
    style A fill:#f9f,stroke:#333
    style B fill:#ff9,stroke:#333
    style C fill:#9f9,stroke:#333
    style D fill:#9f9,stroke:#333
    style E fill:#9ff,stroke:#333
    style F fill:#9f9,stroke:#333
    style G fill:#ff9,stroke:#333
    style H fill:#9ff,stroke:#333
    style I fill:#f99,stroke:#333
    style J fill:#9f9,stroke:#333

classDef step fill:#f9f,stroke:#333
classDef decision fill:#ff9,stroke:#333
classDef action fill:#9f9,stroke:#333
classDef address fill:#9ff,stroke:#333
classDef confirm fill:#f99,stroke:#333
