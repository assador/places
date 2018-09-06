-- phpMyAdmin SQL Dump
-- version 4.6.6deb5
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:3306
-- Время создания: Сен 06 2018 г., 19:07
-- Версия сервера: 5.6.30-1
-- Версия PHP: 7.2.9-1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `db_places`
--

-- --------------------------------------------------------

--
-- Структура таблицы `images`
--

CREATE TABLE `images` (
  `id` varchar(32) NOT NULL,
  `file` varchar(260) NOT NULL,
  `size` int(10) UNSIGNED NOT NULL,
  `type` varchar(45) NOT NULL,
  `lastmodified` int(10) UNSIGNED NOT NULL,
  `srt` double NOT NULL,
  `placeid` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `images`
--

INSERT INTO `images` (`id`, `file`, `size`, `type`, `lastmodified`, `srt`, `placeid`) VALUES
('3L2VrzSoPdIO2wkyfJqD0qKKQ6iVNoa3', 'I272Hu3SzSdeIyN6dBrm75Ju3N31Jqe7.jpg', 980441, 'image/jpeg', 4294967295, 4, 'XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5'),
('7NCMuAhZKncLolQ1otR2J3mmGIMX8SeI', '5ilDuUmiJZk5y3VucNu2PDRBjcn5RcJ0.jpg', 369699, 'image/jpeg', 4294967295, 3, '3QLONIzBjoVvvOHwQggBgN9x0owEJ9CG'),
('aBMwVnfbVf9jTt2MesPSALtJRU7I116I', 'ET7USbfTPjx0EMvpKuNyVGGPf2OKbbbX.jpg', 1069084, 'image/jpeg', 4294967295, 5, 'XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5'),
('AQijnAYMDI45e83VHe9iVV9j0jp1AV4B', 'IYd8JjO7ZsCZY0f9CB1bpcgfuIygJqVM.jpg', 312682, 'image/jpeg', 4294967295, 5, '3QLONIzBjoVvvOHwQggBgN9x0owEJ9CG'),
('C0jkLP0puVKLr7izsvn7VnlpphFp5a8s', 'KB8gouVxMtLzrzKqx0Su8ZFkz7AMcVao.jpg', 1249177, 'image/jpeg', 4294967295, 6, 'XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5'),
('FpAopfraWmjhJp4mzXuErS9xWX6N9Lgw', 'AFzrEoFvklVABOmr3qJkXSx5oHiOg9q1.jpg', 515597, 'image/jpeg', 4294967295, 1, '3QLONIzBjoVvvOHwQggBgN9x0owEJ9CG'),
('kQS3QC7lVbm7gToLSKRoCII9mX2YKKDG', 'qm7IiNeVneFulBEQJy5dPmfQwXbxrd3R.jpg', 319915, 'image/jpeg', 4294967295, 4, '3QLONIzBjoVvvOHwQggBgN9x0owEJ9CG'),
('rJlQwRfCUFmQ4ZjoIW2nB1cnrg0bIkcT', 'FXrPZRgsGHgjo9H9y1CPnMjYJx2h5S2F.jpg', 275030, 'image/jpeg', 4294967295, 6, '3QLONIzBjoVvvOHwQggBgN9x0owEJ9CG'),
('VKoSWkm0o22tD33Nmqurnaff8bIugZ4P', '2OyOfUCqKFn9Xhn2QB4zao9H6GELfzRx.jpg', 912579, 'image/jpeg', 4294967295, 1, 'XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5'),
('vnIwwddZIgGHJKo2gHAjdMUJvfbk0NEj', 'hoCO1KtsSHGeJbJGP0L0lSjlsAGum5nW.jpg', 314376, 'image/jpeg', 4294967295, 2, '3QLONIzBjoVvvOHwQggBgN9x0owEJ9CG'),
('XAEU49xZUnKlIJrJBveARTsBevqJ7Z9J', 'gCRex6rIVgZ8up6WdoAKfiK8SiwFrJLa.jpg', 989044, 'image/jpeg', 4294967295, 2, 'XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5'),
('YV2oLUntywTtMIC3eirU7WsxvNmgRozv', 'qFZiwq3YTD99yz8RJp1JrJntZBoDO8ix.jpg', 1429627, 'image/jpeg', 4294967295, 8, 'XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5'),
('ZNT2Q6H75HyjQONfYI5mpu7WBLcWhE7T', 'GIpHf2rPIDlSlOBICslRPkTfuwJWm1O1.jpg', 1032824, 'image/jpeg', 4294967295, 3, 'XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5');

-- --------------------------------------------------------

--
-- Структура таблицы `places`
--

CREATE TABLE `places` (
  `id` varchar(32) NOT NULL,
  `name` varchar(500) NOT NULL,
  `description` varchar(5000) DEFAULT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `srt` int(10) UNSIGNED NOT NULL,
  `userid` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `places`
--

INSERT INTO `places` (`id`, `name`, `description`, `latitude`, `longitude`, `srt`, `userid`) VALUES
('3QLONIzBjoVvvOHwQggBgN9x0owEJ9CG', 'Наш дом', 'Дом, милый дом. Дурдом.', 55.8682232, 37.656907, 1, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g'),
('78NsJVnNWe00ouT5l9XaRm3GKDZ2sPSp', 'Дом Станислава Моисеича', 'Описывать толком нечего.', 55.8663861, 37.6504214, 4, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g'),
('QVf1eC7zmr4tToT2CaQZBoOF7o2p5gUV', 'Мокрая стоянка на Сейдозере', '', 67.8138429, 34.8175475, 9, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g'),
('s2R4Zku95nXgAbUuQePzqORgTyKTBR31', 'Метеостанция «Ак-Кем»', '', 49.9140996, 86.5438636, 8, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g'),
('twXnePacuM5yGKnTv3G6p4l8b8zD7o1l', 'Дом Аси', 'Вроде бы, здесь. И вроде бы, Ася здесь уже не живёт.', 55.8124296, 37.6584837, 5, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g'),
('VY6PVv96m0munz8zt3Vw4MqFiukElbtF', 'Дом Дениса Абрамыча', 'Сколько выпито, Господи…', 55.8752988, 37.6628563, 3, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g'),
('XdI5eAeQghfS3fJ1O8J3T8pefUXBzXc5', 'Бородеевская дача', 'Куча яблок, вишни и прочих корнеплодов.', 55.2094133, 38.7854742, 6, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g'),
('xMimEH0yPFBFheB6Wa0FAqT6GIxmtTLJ', 'Дом Бородея', 'Бородея дом.', 55.8596921, 37.6376649, 2, 'd7DTeT3hnoAKzWVTzdDVGviOMr8qp49g');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` varchar(32) NOT NULL,
  `login` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `confirmed` tinyint(1) NOT NULL,
  `confirmbefore` datetime NOT NULL,
  `token` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `login`, `password`, `name`, `email`, `phone`, `confirmed`, `confirmbefore`, `token`) VALUES
('d7DTeT3hnoAKzWVTzdDVGviOMr8qp49g', 'assador', '$2y$10$QoXfxOKc30clRHvVvnWeKOjwKUZCOuN5QoUWkADuCIZqun/Ejx336', 'Дмитрий Соколов', 'dmitry@sokolov.website', '+79647722661', 1, '2018-09-07 04:05:37', '5oYKDgF3iVFGkfSaOoEkrB3kHzuKBCzC'),
('X87bxlat3AezCsh6D2S9fCHVAAkdCCZr', '1', '$2y$10$JvN6ZR7DWDtQ5uSWwCrGWOPFSJYEdXoUFiIydcZTXsl3snKsMJzG2', 'Васисуалий', 'niafalcon@mail.ru', '+71234567890', 1, '2018-09-07 04:42:38', 'hYGTm3NAG9uFHMJwbU6tx9OSqKphicbN');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `places`
--
ALTER TABLE `places`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
