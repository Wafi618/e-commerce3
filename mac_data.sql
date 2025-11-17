--
-- PostgreSQL database dump
--

\restrict 8dXJZ9jCJmxFYFYUBQDjGqzqmiGYgm0azMMVt5khe6gmn2CXZ80WZ6XswqfmlGX

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: ghostxwafi
--

COPY public."Product" (id, name, price, image, stock, category, description, "createdAt", "updatedAt", images, subcategory) FROM stdin;
7	Sweater	650.00	https://iili.io/Kkpc66g.png	8	Winter cloth	nice warm clothes	2025-10-16 21:34:00.229	2025-11-15 07:10:23.59	{"<img src=\\"https://iili.io/Kkp6vHb.png\\" alt=\\"image\\" border=\\"0\\">","<img src=\\"https://iili.io/KkpiR4t.png\\" alt=\\"image\\" border=\\"0\\">","<img src=\\"https://iili.io/KkpLihv.png\\" alt=\\"image\\" border=\\"0\\">"}	\N
1	Cargo Pants	150.00	https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/E30610s.jpg?im=Resize,width=750	4	Pants	Of course! Here is a comprehensive body of text designed to test a wide variety of Markdown features, from the most basic to more advanced or extended syntax. You can copy and paste this into any Markdown-supporting editor to see how it renders.\n\n***\n\n# Markdown Feature Test Document\n\nThis document serves as a comprehensive test and demonstration for various Markdown features. It includes everything from basic text formatting to more complex elements like tables, code blocks, and footnotes.\n\n## 1. Text Formatting\n\nThis section covers the essentials of styling text.\n\nYou can have **bold text** using double asterisks or double underscores. You can also have *italic text* using single asterisks or single underscores. For something that is both, you can combine them for ***bold and italic text***.\n\nSometimes you need to strike something out, like this ~~mistake~~.\n\nFor highlighting commands or variable names within a sentence, you can use `inline code`. For example, you should run the `npm install` command.\n\nTo show a literal asterisk, you must escape it, like this: \\*. Without the backslash, it would just be *italic*.\n\n## 2. Headings\n\nThis document uses a variety of heading levels to demonstrate hierarchy.\n\n### Level 3 Heading\nThis is a subsection.\n\n#### Level 4 Heading\nThis is a sub-subsection.\n\n##### Level 5 Heading\nEven more granular.\n\n###### Level 6 Heading\nThe most granular heading level.\n\n---\n\n## 3. Lists\n\nThere are several types of lists available in Markdown.\n\n### Unordered Lists\n- Item 1\n- Item 2\n    - Nested Item 2a\n    - Nested Item 2b\n* Item 3 (using an asterisk)\n    * Nested Item 3a\n+ Item 4 (using a plus sign)\n\n### Ordered Lists\n1. First item\n2. Second item\n3. Third item\n    1. Nested ordered item\n    2. Another nested item\n4. Fourth item\n\n### Task Lists (Checklists)\n- [x] Complete project proposal\n- [ ] Review feedback from the team\n- [ ] Deploy to production\n\n## 4. Links and Images\n\nYou can link to external resources and embed images.\n\nA standard link to a search engine: [Visit Google](https://www.google.com "Google's Homepage").\n\nYou can also use reference-style links for cleaner Markdown. Here is an example of a link to the [Markdown Guide][1].\n\nHere is an inline image with alt text:\n![A placeholder image of a gray square](https://via.placeholder.com/150 "Placeholder Image")\n\nAnd here is a clickable image (an image inside a link):\n[![A clickable placeholder image](https://via.placeholder.com/150/0000FF/FFFFFF?text=Click+Me)](https://en.wikipedia.org/wiki/Markdown)\n\n[1]: https://www.markdownguide.org/\n\n## 5. Blockquotes\n\nBlockquotes are great for quoting text from another source.\n\n> "The advance of technology is based on making it fit in so that you don't really even notice it, so it's part of everyday life."\n> \\- Bill Gates\n\nBlockquotes can also be nested:\n> This is the first level of quoting.\n>\n> > This is a nested blockquote.\n>\n> Back to the first level.\n\n## 6. Code Blocks\n\nFor longer snippets of code, use fenced code blocks with syntax highlighting.\n\n```javascript\n// A simple JavaScript function\nfunction greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet('World');\n```\n\n```python\n# A simple Python script\ndef main():\n    message = "Hello from a Python code block!"\n    print(message)\n\nif __name__ == "__main__":\n    main()\n```\n\nAn un-highlighted or plain text block:\n```\nThis is a plain text block.\nNo syntax highlighting will be applied.\nUseful for log files or simple text.\n```\n\n## 7. Tables\n\nTables are created using pipes `|` and hyphens `-`.\n\n| Header 1      | Header 2      | Header 3      |\n|---------------|:-------------:|--------------:|\n| Left-aligned  | Centered      | Right-aligned |\n| Cell 1        | Cell 2        | Cell 3        |\n| Another row   | With content  | And more      |\n| `code in cell`| *italic cell* | **bold cell** |\n\n## 8. Horizontal Rules\n\nYou can create a thematic break or horizontal rule with three or more hyphens, asterisks, or underscores.\n\n---\n\n***\n\n___\n\n## 9. Extended Syntax (May not be supported everywhere)\n\nThis section includes features that are part of extended Markdown specifications like GitHub Flavored Markdown (GFM).\n\n### Footnotes\nHere is some text with a footnote.[^1] You can find the corresponding note at the bottom of the document.\n\n### HTML Support\nYou can often embed raw HTML directly into Markdown.\n\nPress <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy text.\n\n<details>\n  <summary>Click to expand for more details!</summary>\n  \n  This content is hidden by default but can be revealed by the user. It's a great way to keep documents tidy.\n  \n</details>\n\nThis text is <u>underlined</u> using an HTML tag.\n\n[^1]: This is the footnote text. It provides additional information or a citation.	2025-10-07 06:30:11.409	2025-10-12 02:30:55.411	{https://iili.io/KNQEdPf.png}	\N
3	chocolate	50.00	https://www.shutterstock.com/image-illustration/chocolate-bar-brown-silver-foil-260nw-113394082.jpg	2	candy	\N	2025-10-08 23:35:16.404	2025-10-11 06:20:25.375	{}	\N
6	kat	20.00	https://static.vecteezy.com/system/resources/thumbnails/036/273/724/small_2x/cat-head-silhouette-illustration-on-isolated-background-free-vector.jpg	2	animal	\N	2025-10-08 23:39:27.995	2025-11-15 07:10:23.591	{}	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: ghostxwafi
--

COPY public."User" (id, email, name, password, role, "createdAt", "updatedAt", address, city, country, "failedResetAttempts", floor, house, phone, "resetPin", "restrictedAccess", "darkMode") FROM stdin;
cmgg5wclu0002itiwh190a9yi	putitinwafi@gmail.com	Wafi Admin	$2a$10$Rn4w1Uh/v8/sH5iPLoAZgevbejbZaoTGF1DxbEvPhzveD.N4wZSty	ADMIN	2025-10-07 06:11:33.715	2025-11-16 06:35:42.789	18051 S Tamiami Trl	florida	Bangladesh	0			19412655115	\N	f	t
cmgg6flaj0000itvfbxpfcjdx	putitinwafi.2@gmail.com	Wafi22	$2a$10$gAULvxr9tp0NWZD1O.fxX.QlKjNg6QX49uKVkjPv.Tu10f5/9o9fi	CUSTOMER	2025-10-07 06:26:31.435	2025-11-15 05:58:21.662	21150 GERTRUDE AVE 	Chattogram	Bangladesh	0	L2	APT	2392863603	\N	f	t
cmgg5wck50000itiwvce8cw48	infostaraccess@gmail.com	A.K.M Robiul Hassan	$2a$10$MPw6T1BBjwTconvU94eku.TM018drNqDtbfh7zMpv4Ghn2H6.AhKq	ADMIN	2025-10-07 06:11:33.654	2025-10-08 06:36:14.658	\N	\N	Bangladesh	0	\N	\N	\N	\N	f	f
cmgg5wcke0001itiwvsp78i2y	akmrobiul2024@gmail.com	A.K.M Robiul Hassan	$2a$10$MPw6T1BBjwTconvU94eku.TM018drNqDtbfh7zMpv4Ghn2H6.AhKq	ADMIN	2025-10-07 06:11:33.663	2025-11-16 17:43:29.079	\N	\N	Bangladesh	0	\N	\N	\N	\N	t	t
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: ghostxwafi
--

COPY public."CartItem" (id, "userId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: ghostxwafi
--

COPY public."Message" (id, "senderId", "receiverId", subject, message, "isRead", "isPasswordReset", "createdAt") FROM stdin;
1	cmgg6flaj0000itvfbxpfcjdx	cmgg5wck50000itiwvce8cw48	[Password Reset Request] please reset	i forgor\n\nUser Email: putitinwafi.2@gmail.com\nUser Phone: 2392863603	f	t	2025-10-07 07:05:41.401
2	cmgg6flaj0000itvfbxpfcjdx	cmgg5wcke0001itiwvsp78i2y	[Password Reset Request] pls	passt\n\nUser Email: putitinwafi.2@gmail.com\nUser Phone: 2392863603	f	t	2025-10-08 06:37:25.192
4	cmgg6flaj0000itvfbxpfcjdx	cmgg5wck50000itiwvce8cw48	[Password Reset Request] pls	passt\n\nUser Email: putitinwafi.2@gmail.com\nUser Phone: 2392863603	f	t	2025-10-08 06:37:25.192
3	cmgg6flaj0000itvfbxpfcjdx	cmgg5wclu0002itiwh190a9yi	[Password Reset Request] pls	passt\n\nUser Email: putitinwafi.2@gmail.com\nUser Phone: 2392863603	f	t	2025-10-08 06:37:25.192
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: ghostxwafi
--

COPY public."Order" (id, "userId", customer, email, total, status, "createdAt", "updatedAt", address, city, country, floor, house, notes, phone, "paymentMethod", "paymentPhoneNumber", "paymentTrxId") FROM stdin;
1	cmgg5wclu0002itiwh190a9yi	Wafi Admin	putitinwafi@gmail.com	150.00	CANCELLED	2025-10-08 06:44:14.092	2025-10-08 06:56:58.563	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	cmgg6flaj0000itvfbxpfcjdx	Wafi22	putitinwafi.2@gmail.com	220.00	COMPLETED	2025-10-10 06:47:40.221	2025-10-10 06:49:14.931	21150 GERTRUDE AVE 	Chattogram	Bangladesh	L2	APT	fast delivery pls	2392863603	\N	\N	\N
10	cmgg5wclu0002itiwh190a9yi	Wafi Admin	putitinwafi@gmail.com	20.00	CANCELLED	2025-10-12 02:26:38.55	2025-10-12 02:30:19.921	18051 S Tamiami Trl	florida	Bangladesh	\N	\N	\N	19412655115	\N	\N	\N
9	cmgg5wclu0002itiwh190a9yi	Wafi Admin	putitinwafi@gmail.com	150.00	CANCELLED	2025-10-12 01:11:47.274	2025-10-12 02:30:55.412	18051 S Tamiami Trl	florida	Bangladesh	\N	\N	\N	19412655115	\N	\N	\N
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: ghostxwafi
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, "createdAt") FROM stdin;
1	1	1	1	150.00	2025-10-08 06:44:14.092
2	2	1	1	150.00	2025-10-10 06:47:40.221
3	2	3	1	50.00	2025-10-10 06:47:40.221
4	2	6	1	20.00	2025-10-10 06:47:40.221
13	9	1	1	150.00	2025-10-12 01:11:47.274
14	10	6	1	20.00	2025-10-12 02:26:38.55
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: ghostxwafi
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
80e17da9-cfe4-4dcc-8f4b-74bb3bc75d3c	fee41718b61968736835c373dcbd854ff3068386abf66ccd7f436a3d6e3c112a	2025-10-07 02:04:46.884577-04	20251004011305_init	\N	\N	2025-10-07 02:04:46.868253-04	1
c555dd23-f509-45d7-ac50-2e9d8a527a9c	44f145c1c5cd8e1cb3400fc53da09732a29401be837acaceb2b101db0d6d7e23	2025-10-07 02:04:59.158312-04	20251007060459_add_password_reset_features	\N	\N	2025-10-07 02:04:59.149171-04	1
dc2cdd0b-82ef-4be7-9fe0-b84ad2e5d425	abe2059e65da65e75ead81c0b282688dd8628928a67c84e5547ff62928f01dc9	2025-10-08 19:10:10.678451-04	20251008_use_decimal_for_money		\N	2025-10-08 19:10:10.678451-04	0
18846dae-d6b5-4898-af6d-4b1337bc1de9	20244d31bed951621fc1ae04a75f2367ded1ce069aaf2fb250a33f3d28f9cfb8	2025-10-10 01:08:48.525529-04	20251010050848_add_pending_payment_table	\N	\N	2025-10-10 01:08:48.522472-04	1
33aaa23b-da61-435c-b545-b244b8ddf59f	b45e037416a50e3cd624d44ef1571e14739b0edf747c2786e2fd41924d0af642	2025-10-10 02:39:38.03686-04	20251010063938_remove_pending_payment_table	\N	\N	2025-10-10 02:39:38.034593-04	1
7dae2b7d-3550-443f-a75c-78f69c89403a	7462b7a5e89ca6ec450301f0374f116131e71089ed46164db6cc744af7c9d11f	2025-10-11 19:09:05.804027-04	20251011230905_add_dark_mode_to_user	\N	\N	2025-10-11 19:09:05.802233-04	1
427a5d29-b790-4029-8a91-06274f44ce78	78e60ebe7e5819fca8fb97ff21859c39fec9cdb2ccea449ccc1e6eaf90c5e18c	2025-11-15 01:49:29.823495-05	20251115064929_add_manual_payment_fields	\N	\N	2025-11-15 01:49:29.822149-05	1
\.


--
-- Name: CartItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ghostxwafi
--

SELECT pg_catalog.setval('public."CartItem_id_seq"', 152, true);


--
-- Name: Message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ghostxwafi
--

SELECT pg_catalog.setval('public."Message_id_seq"', 4, true);


--
-- Name: OrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ghostxwafi
--

SELECT pg_catalog.setval('public."OrderItem_id_seq"', 19, true);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ghostxwafi
--

SELECT pg_catalog.setval('public."Order_id_seq"', 13, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ghostxwafi
--

SELECT pg_catalog.setval('public."Product_id_seq"', 7, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 8dXJZ9jCJmxFYFYUBQDjGqzqmiGYgm0azMMVt5khe6gmn2CXZ80WZ6XswqfmlGX

