-- Adres koordinatlarını güncelleme

-- Kadıköy Caferağa
UPDATE addresses SET lat = 40.9867, lng = 29.0287 WHERE district = 'Kadıköy' AND neighborhood = 'Caferağa';

-- Şişli Mecidiyeköy
UPDATE addresses SET lat = 41.0677, lng = 28.9870 WHERE district = 'Şişli' AND neighborhood = 'Mecidiyeköy';

-- Beşiktaş Levent
UPDATE addresses SET lat = 41.0850, lng = 29.0141 WHERE district = 'Beşiktaş' AND neighborhood = 'Levent';

-- Üsküdar Acıbadem
UPDATE addresses SET lat = 41.0119, lng = 29.0385 WHERE district = 'Üsküdar' AND neighborhood = 'Acıbadem';

-- Bakırköy Ataköy
UPDATE addresses SET lat = 40.9796, lng = 28.8386 WHERE district = 'Bakırköy' AND neighborhood = 'Ataköy';

-- Beyoğlu Cihangir
UPDATE addresses SET lat = 41.0320, lng = 28.9835 WHERE district = 'Beyoğlu' AND neighborhood = 'Cihangir';

-- Maltepe Bağlarbaşı
UPDATE addresses SET lat = 40.9361, lng = 29.1320 WHERE district = 'Maltepe' AND neighborhood = 'Bağlarbaşı';

-- Sarıyer Maslak
UPDATE addresses SET lat = 41.1120, lng = 29.0178 WHERE district = 'Sarıyer' AND neighborhood = 'Maslak';

-- Ataşehir Barbaros
UPDATE addresses SET lat = 40.9760, lng = 29.1023 WHERE district = 'Ataşehir' AND neighborhood = 'Barbaros';

-- Beykoz Kavacık
UPDATE addresses SET lat = 41.0912, lng = 29.0975 WHERE district = 'Beykoz' AND neighborhood = 'Kavacık';

-- Koordinat yoksa genel semte göre varsayılan değer ata
UPDATE addresses SET 
    lat = CASE 
        WHEN district = 'Kadıköy' THEN 40.9830
        WHEN district = 'Şişli' THEN 41.0570
        WHEN district = 'Beşiktaş' THEN 41.0430
        WHEN district = 'Üsküdar' THEN 41.0230
        WHEN district = 'Bakırköy' THEN 40.9810
        WHEN district = 'Beyoğlu' THEN 41.0370
        WHEN district = 'Maltepe' THEN 40.9350
        WHEN district = 'Sarıyer' THEN 41.1670
        WHEN district = 'Ataşehir' THEN 40.9830
        WHEN district = 'Beykoz' THEN 41.1300
        ELSE 41.0082 -- İstanbul merkezi
    END,
    lng = CASE 
        WHEN district = 'Kadıköy' THEN 29.0630
        WHEN district = 'Şişli' THEN 28.9870
        WHEN district = 'Beşiktaş' THEN 29.0080
        WHEN district = 'Üsküdar' THEN 29.0150
        WHEN district = 'Bakırköy' THEN 28.8720
        WHEN district = 'Beyoğlu' THEN 28.9850
        WHEN district = 'Maltepe' THEN 29.1510
        WHEN district = 'Sarıyer' THEN 29.0550
        WHEN district = 'Ataşehir' THEN 29.1280
        WHEN district = 'Beykoz' THEN 29.0960
        ELSE 28.9784 -- İstanbul merkezi
    END
WHERE lat IS NULL OR lng IS NULL;
