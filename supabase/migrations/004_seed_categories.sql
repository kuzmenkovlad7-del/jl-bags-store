-- Seed categories according to client specifications
INSERT INTO categories (slug, name_uk, name_ru, sort_order) VALUES
('ryukzak_ekoshkira', 'Рюкзак екошкіра', 'Рюкзак экокожа', 1),
('ryukzak_tekstil', 'Рюкзак текстиль', 'Рюкзак текстиль', 2),
('shkilnyi_ryukzak', 'Шкільний рюкзак', 'Школьный рюкзак', 3),
('klatch_krosbodi', 'Клатч/Кросбоді', 'Клатч/Кросс-боди', 4),
('sumka_ekoshkira', 'Сумка екошкіра', 'Сумка экокожа', 5),
('sumka_stobana', 'Сумка стьобана', 'Сумка стеганая', 6),
('bananka', 'Бананка', 'Бананка', 7),
('sumka_tekstil', 'Сумка текстиль', 'Сумка текстиль', 8),
('rozprodazh', 'Розпродаж', 'Распродажа', 9),
('cholovicha_sumka', 'Чоловіча сумка', 'Мужская сумка', 10),
('gamanets_zhinochyi', 'Гаманець жіночий', 'Кошелек женский', 11),
('gamanets_cholovichyi', 'Гаманець чоловічий', 'Кошелек мужской', 12),
('sumka_sport', 'Сумка спортивна', 'Сумка спортивная', 13),
('zamsha', 'Замша', 'Замша', 14)
ON CONFLICT (slug) DO NOTHING;
