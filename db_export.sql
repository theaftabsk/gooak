--
-- PostgreSQL database dump
--

\restrict qQbcq6ef9aG8RBAaQu5DFAg2tEsPJqP3OtsSzmeMo5WcAaDPIk2r3ml4WbDAbXd

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(60),
    entity_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    type character varying(20) DEFAULT 'shipping'::character varying NOT NULL,
    full_name character varying(150) NOT NULL,
    phone character varying(30),
    address_line1 text NOT NULL,
    address_line2 text,
    city character varying(100) NOT NULL,
    state character varying(100),
    postal_code character varying(20),
    country character(2) DEFAULT 'BD'::bpchar NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    title character varying(150),
    image_url text NOT NULL,
    link_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(150) NOT NULL,
    logo_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    cart_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    customer_id uuid,
    session_id character varying(255),
    coupon_id uuid,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.carts OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    parent_id uuid,
    name character varying(150) NOT NULL,
    slug character varying(150) NOT NULL,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    show_in_menu boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    code character varying(60) NOT NULL,
    type character varying(20) NOT NULL,
    value numeric(10,2) NOT NULL,
    min_order numeric(10,2) DEFAULT 0 NOT NULL,
    usage_limit integer,
    used_count integer DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(150),
    email character varying(255),
    phone character varying(30),
    password_hash text,
    guest_token character varying(255),
    is_verified boolean DEFAULT false NOT NULL,
    avatar_url text,
    total_orders integer DEFAULT 0 NOT NULL,
    total_spent numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: inventory_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    type character varying(30) NOT NULL,
    qty_change integer NOT NULL,
    qty_after integer NOT NULL,
    ref_id uuid,
    note text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.inventory_logs OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    type character varying(60) NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    is_read boolean DEFAULT false NOT NULL,
    ref_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    order_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    product_snap jsonb NOT NULL,
    qty integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_status_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    order_id uuid NOT NULL,
    from_status character varying(30),
    to_status character varying(30) NOT NULL,
    note text,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_status_logs OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    customer_id uuid,
    order_number character varying(30) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) NOT NULL,
    coupon_id uuid,
    shipping_rate_id uuid,
    shipping_address jsonb NOT NULL,
    billing_address jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    slug character varying(150) NOT NULL,
    type character varying(30) NOT NULL,
    theme jsonb DEFAULT '{}'::jsonb,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.pages OWNER TO postgres;

--
-- Name: payment_gateways; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_gateways (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(60) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_gateways OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    order_id uuid NOT NULL,
    gateway_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character(3) DEFAULT 'INR'::bpchar NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    transaction_id character varying(255),
    gateway_resp jsonb DEFAULT '{}'::jsonb NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: platform_admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    permissions text[] DEFAULT ARRAY[]::text[],
    is_owner boolean DEFAULT false NOT NULL
);


ALTER TABLE public.platform_admins OWNER TO postgres;

--
-- Name: product_faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_faqs OWNER TO postgres;

--
-- Name: product_gallery; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_gallery (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    url text NOT NULL,
    alt_text text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_cover boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_gallery OWNER TO postgres;

--
-- Name: product_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    type character varying(50) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_sections OWNER TO postgres;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    sku character varying(100) NOT NULL,
    label character varying(255),
    price numeric(12,2) NOT NULL,
    compare_price numeric(12,2),
    cost_price numeric(12,2),
    stock_qty integer DEFAULT 0 NOT NULL,
    low_stock_at integer DEFAULT 5 NOT NULL,
    image_url text,
    total_sold integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    category_id uuid,
    brand_id uuid,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    short_desc text,
    price numeric(12,2) NOT NULL,
    compare_price numeric(12,2),
    cost_price numeric(12,2),
    master_sku character varying(100),
    status character varying(30) DEFAULT 'draft'::character varying NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    has_variants boolean DEFAULT false NOT NULL,
    tax_id uuid,
    total_sold integer DEFAULT 0 NOT NULL,
    meta_title character varying(255),
    meta_description text,
    custom_sections jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    customer_id uuid,
    rating smallint NOT NULL,
    title character varying(200),
    body text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    "group" character varying(60),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: shipping_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    rate numeric(10,2) NOT NULL,
    free_above numeric(10,2) DEFAULT 0 NOT NULL,
    zone_label character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.shipping_rates OWNER TO postgres;

--
-- Name: shop_domains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shop_domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    domain character varying(255) NOT NULL,
    type character varying(20) DEFAULT 'subdomain'::character varying NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.shop_domains OWNER TO postgres;

--
-- Name: shops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(100) NOT NULL,
    owner_id uuid,
    plan character varying(50) DEFAULT 'free'::character varying NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    logo_url text,
    description text,
    currency character(3) DEFAULT 'BDT'::bpchar NOT NULL,
    timezone character varying(60) DEFAULT 'Asia/Dhaka'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    db_connection_url text
);


ALTER TABLE public.shops OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    description text,
    is_public boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: taxes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.taxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    rate numeric(5,2) NOT NULL,
    type character varying(30) DEFAULT 'percent'::character varying NOT NULL,
    is_inclusive boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.taxes OWNER TO postgres;

--
-- Name: tenant_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(100) NOT NULL,
    owner_name character varying(150) NOT NULL,
    owner_email character varying(255) NOT NULL,
    phone character varying(30),
    category character varying(100),
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tenant_requests OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    password character varying(100),
    role character varying(30) DEFAULT 'staff'::character varying NOT NULL,
    avatar_url text,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: variant_attributes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.variant_attributes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    attr_key character varying(60) NOT NULL,
    attr_value character varying(150) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.variant_attributes OWNER TO postgres;

--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.warehouses OWNER TO postgres;

--
-- Name: widgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.widgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    sort_order integer NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    styles jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.widgets OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
67e39410-9be5-4af0-b995-4f2a6172174c	75c770cfd57f2f4da69c49dda35111200eefe6948214395379cae0b74ba5ae32	2026-06-11 10:07:17.520822+00	20260610050457_init_database	\N	\N	2026-06-11 10:07:17.483976+00	1
9762eb7b-946f-4c92-9631-81f5cce89a80	749990a1049e5c76e16d60e1b42e7b871811196cda8ed08059f553c5334d4f0e	2026-06-11 10:10:13.139989+00	20260611101013_add_page_builder_models	\N	\N	2026-06-11 10:10:13.056407+00	1
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, shop_id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (id, shop_id, customer_id, type, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default, created_at) FROM stdin;
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (id, shop_id, title, image_url, link_url, sort_order, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, shop_id, name, slug, logo_url, is_active, created_at) FROM stdin;
f006be22-0e75-4dab-ac84-a50023364994	7a4606b0-d056-48ad-b449-86063da9da38	TEST	TEST	\N	t	2026-06-11 13:23:39.204+00
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, shop_id, cart_id, variant_id, qty, unit_price, created_at) FROM stdin;
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carts (id, shop_id, customer_id, session_id, coupon_id, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, shop_id, parent_id, name, slug, image_url, sort_order, is_active, show_in_menu, created_at) FROM stdin;
ea6d8284-cc92-48ee-ba7f-9de1d0e88230	7a4606b0-d056-48ad-b449-86063da9da38	\N	a	a	\N	0	t	t	2026-06-12 19:36:02.969+00
2da4c957-dda8-4f8a-86d3-f49de7eb00a4	248e1b09-2c95-423b-b406-5ced4ca1a842	\N	New Arrivals	new-arrivals	\N	0	t	t	2026-06-19 14:08:30.989+00
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coupons (id, shop_id, code, type, value, min_order, usage_limit, used_count, starts_at, ends_at, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, shop_id, name, email, phone, password_hash, guest_token, is_verified, avatar_url, total_orders, total_spent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_logs (id, shop_id, variant_id, warehouse_id, type, qty_change, qty_after, ref_id, note, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, shop_id, customer_id, type, title, body, is_read, ref_id, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, shop_id, order_id, variant_id, product_snap, qty, unit_price, line_total, created_at) FROM stdin;
5aa018a4-1b63-4b9a-bbef-49b9eb7d927b	7a4606b0-d056-48ad-b449-86063da9da38	5aff7457-b4f7-4fb9-84ff-843b785d3d51	f374f74f-aa0d-40b1-ae16-cd1e00cf49f5	{"sku": "test", "name": "test", "label": "Standard", "image_url": null}	2	800.00	1600.00	2026-06-13 16:15:48.014+00
54b473e4-6ea9-4639-9892-34e4eba46164	7a4606b0-d056-48ad-b449-86063da9da38	4994a944-761f-4f69-b476-0451d8d6c49b	f374f74f-aa0d-40b1-ae16-cd1e00cf49f5	{"sku": "test", "name": "test", "label": "Standard", "image_url": null}	1	800.00	800.00	2026-06-13 16:22:18.728+00
a09210c9-b566-4b3a-a653-04ca7040493f	7a4606b0-d056-48ad-b449-86063da9da38	77d049a4-db93-4f5e-bdc1-d241aba1dc49	f374f74f-aa0d-40b1-ae16-cd1e00cf49f5	{"sku": "test", "name": "test", "label": "Standard", "image_url": null}	1	800.00	800.00	2026-06-13 16:23:01.278+00
b1b81b7c-5fe3-4e65-8ee6-b23a131cb6c7	7a4606b0-d056-48ad-b449-86063da9da38	4a805351-06dc-4c25-bd16-41326b89b4c3	f374f74f-aa0d-40b1-ae16-cd1e00cf49f5	{"sku": "test", "name": "test", "label": "Standard", "image_url": null}	1	800.00	800.00	2026-06-13 16:24:39.346+00
\.


--
-- Data for Name: order_status_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status_logs (id, shop_id, order_id, from_status, to_status, note, changed_by, created_at) FROM stdin;
e2fa5a20-a153-4414-b370-f916a3d4cc00	7a4606b0-d056-48ad-b449-86063da9da38	5aff7457-b4f7-4fb9-84ff-843b785d3d51	\N	pending	Order submitted via storefront (COD)	\N	2026-06-13 16:15:48.035+00
18d119af-7080-40a3-bfab-edc35bb06a8a	7a4606b0-d056-48ad-b449-86063da9da38	5aff7457-b4f7-4fb9-84ff-843b785d3d51	pending	confirmed	Order confirmed under Cash on Delivery (COD) terms	\N	2026-06-13 16:15:48.049+00
b4760910-d2ff-4f53-b4f4-5492af4a5121	7a4606b0-d056-48ad-b449-86063da9da38	4994a944-761f-4f69-b476-0451d8d6c49b	\N	pending	Order submitted via storefront (RAZORPAY)	\N	2026-06-13 16:22:18.747+00
11da997b-8d39-45c1-a78d-810dd891b614	7a4606b0-d056-48ad-b449-86063da9da38	77d049a4-db93-4f5e-bdc1-d241aba1dc49	\N	pending	Order submitted via storefront (RAZORPAY)	\N	2026-06-13 16:23:01.293+00
6aa4ce01-d8b2-4a13-80f2-3ebd17b8a28f	7a4606b0-d056-48ad-b449-86063da9da38	4a805351-06dc-4c25-bd16-41326b89b4c3	\N	pending	Order submitted via storefront (RAZORPAY)	\N	2026-06-13 16:24:39.361+00
ac648957-6305-4099-9527-dff80ec1db1d	7a4606b0-d056-48ad-b449-86063da9da38	4a805351-06dc-4c25-bd16-41326b89b4c3	pending	confirmed	Payment verified and captured via storefront client callback	\N	2026-06-13 16:25:27.737+00
7122ec9b-1af1-4f2f-b9c8-85b73bac5eaa	7a4606b0-d056-48ad-b449-86063da9da38	4a805351-06dc-4c25-bd16-41326b89b4c3	confirmed	completed	Order status updated to completed	\N	2026-06-13 16:26:50.693+00
e2e6cc1c-14f7-47b5-81a4-9f1449e0a141	7a4606b0-d056-48ad-b449-86063da9da38	4a805351-06dc-4c25-bd16-41326b89b4c3	completed	cancelled	Order status updated to cancelled	\N	2026-06-13 16:27:04.852+00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, shop_id, customer_id, order_number, status, subtotal, discount_amount, shipping_amount, tax_amount, total, coupon_id, shipping_rate_id, shipping_address, billing_address, notes, created_at, updated_at) FROM stdin;
5aff7457-b4f7-4fb9-84ff-843b785d3d51	7a4606b0-d056-48ad-b449-86063da9da38	\N	ORD-67347882-6358	confirmed	1600.00	0.00	0.00	0.00	1600.00	\N	\N	{"city": "jbhjub", "phone": "9732351545", "state": "bjhb", "country": "IN", "full_name": "gfvy", "postal_code": "741156", "address_line1": "hgyug"}	\N	mkl	2026-06-13 16:15:48.014+00	2026-06-13 16:15:48.044+00
4994a944-761f-4f69-b476-0451d8d6c49b	7a4606b0-d056-48ad-b449-86063da9da38	\N	ORD-67738577-6869	pending	800.00	0.00	0.00	0.00	800.00	\N	\N	{"city": "bjhub", "phone": "9732351545", "state": "jnin", "country": "IN", "full_name": "bvhgv", "postal_code": "741156", "address_line1": "njnjh"}	\N	b hbh	2026-06-13 16:22:18.728+00	2026-06-13 16:22:18.728+00
77d049a4-db93-4f5e-bdc1-d241aba1dc49	7a4606b0-d056-48ad-b449-86063da9da38	\N	ORD-67781253-3045	pending	800.00	0.00	0.00	0.00	800.00	\N	\N	{"city": "dfhdfh", "phone": "741852963", "state": "dfhdfh", "country": "IN", "full_name": "sdgfdsg", "postal_code": "771156", "address_line1": "fddh"}	\N	dfh	2026-06-13 16:23:01.278+00	2026-06-13 16:23:01.278+00
4a805351-06dc-4c25-bd16-41326b89b4c3	7a4606b0-d056-48ad-b449-86063da9da38	\N	ORD-67879321-1170	cancelled	800.00	0.00	0.00	0.00	800.00	\N	\N	{"city": "adfhh", "phone": "f7418529630", "state": "jhdgj", "country": "IN", "full_name": "sdgsdf", "postal_code": "741156", "address_line1": "asdgshg"}	\N	djh	2026-06-13 16:24:39.346+00	2026-06-13 16:27:04.849+00
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pages (id, shop_id, title, slug, type, theme, is_published, created_at, updated_at) FROM stdin;
bb99e52d-6ee7-4d35-bd27-a7c0a20939df	7a4606b0-d056-48ad-b449-86063da9da38	Shop / Product Listing	products	NORMAL	{"primaryColor": "#15803D", "secondaryColor": "#ffffff", "backgroundColor": "#ffffff"}	t	2026-06-13 09:26:00.082+00	2026-06-13 15:36:04.708+00
244709e3-2649-4740-9772-6b921fdda677	7a4606b0-d056-48ad-b449-86063da9da38	Category Details	category	NORMAL	{"primaryColor": "#15803D", "secondaryColor": "#ffffff", "backgroundColor": "#ffffff"}	t	2026-06-13 15:39:22.101+00	2026-06-13 15:39:22.166+00
58475c41-0b1e-4534-9d85-8cb35d86c9b2	7a4606b0-d056-48ad-b449-86063da9da38	About Us	about	NORMAL	{"primaryColor": "#14ff6a", "secondaryColor": "#e5dcdc", "backgroundColor": "#fafafa"}	t	2026-06-12 19:24:26.978+00	2026-06-13 15:55:37.64+00
a0d28f4d-ddbf-4503-89c7-696fb3be92a8	7a4606b0-d056-48ad-b449-86063da9da38	Homepage	index	NORMAL	{"primaryColor": "#2d9518", "secondaryColor": "#ffffff", "backgroundColor": "#ffffff"}	t	2026-06-12 19:10:30.939+00	2026-06-13 15:57:09.214+00
fb22af79-0440-4ecb-948e-7ef2655239a3	a763e98a-9c50-496c-bf75-f16e7ad1d41e	Homepage	index	NORMAL	{"primaryColor": "#15803D", "secondaryColor": "#ffffff", "backgroundColor": "#ffffff"}	t	2026-06-16 04:29:31.883+00	2026-06-16 04:29:31.944+00
33543214-0b9d-4f70-8433-6239b061e40a	248e1b09-2c95-423b-b406-5ced4ca1a842	Home Page	index	home	{}	t	2026-06-19 14:08:31.084+00	2026-06-19 14:08:31.084+00
\.


--
-- Data for Name: payment_gateways; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_gateways (id, shop_id, name, slug, config, is_active, sort_order, created_at) FROM stdin;
3f227f7c-52a0-41be-864c-02888a57da63	7a4606b0-d056-48ad-b449-86063da9da38	Cash on Delivery	cod	{}	t	1	2026-06-12 16:35:40.829+00
ded792ea-c65b-43d3-b546-768f443c488c	7a4606b0-d056-48ad-b449-86063da9da38	Razorpay Online Payment	razorpay	{"key_id": "rzp_test_T1BEwnWZ6Z03ED", "key_secret": "UeKmlBJtSjY7ydP7fStMBv4w"}	t	2	2026-06-12 16:35:40.829+00
498bdab9-cab5-473a-b7fe-0bf60ca0dc6a	a763e98a-9c50-496c-bf75-f16e7ad1d41e	Cash on Delivery	cod	{}	t	1	2026-06-16 04:53:01.287+00
e2be8c03-e4af-4c91-8c3e-c7cf4f985512	a763e98a-9c50-496c-bf75-f16e7ad1d41e	Razorpay Online Payment	razorpay	{"key_id": "rzp_test_placeholder_key_id", "key_secret": "placeholder_secret"}	t	2	2026-06-16 04:53:01.287+00
c7779120-6dd9-42bf-aa3e-1511a98a20e2	248e1b09-2c95-423b-b406-5ced4ca1a842	Cash on Delivery	cod	{}	t	1	2026-06-19 14:08:30.941+00
09e9f142-f3a0-4163-bae6-b277caf5a7ac	248e1b09-2c95-423b-b406-5ced4ca1a842	Razorpay	razorpay	{"key_id": "", "key_secret": ""}	f	2	2026-06-19 14:08:30.941+00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, shop_id, order_id, gateway_id, amount, currency, status, transaction_id, gateway_resp, paid_at, created_at) FROM stdin;
6bc54ec3-d11a-443d-b83a-ce6be09247b0	7a4606b0-d056-48ad-b449-86063da9da38	4a805351-06dc-4c25-bd16-41326b89b4c3	ded792ea-c65b-43d3-b546-768f443c488c	800.00	INR	paid	pay_T1BGCuDojyxiua	{"orderId": "4a805351-06dc-4c25-bd16-41326b89b4c3", "razorpay_order_id": "order_T1BFkLIpasQD7Q", "razorpay_signature": "79298c855a93ea511705bd1901ecb2538546b6ba1219a238a55b2aff8dafd522", "razorpay_payment_id": "pay_T1BGCuDojyxiua"}	2026-06-13 16:25:27.721+00	2026-06-13 16:25:27.722+00
\.


--
-- Data for Name: platform_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_admins (id, name, email, password_hash, status, created_at, updated_at, permissions, is_owner) FROM stdin;
cabd2bd9-fabf-4746-8a1b-6a2dede0d4f2	Platform Owner	admin@oaksol.in	$2b$10$.AMyGmJvFiL42Ph7CYEeKOvOfwNA7pzV2FI6hqvm.FA3NqDlYkeLK	active	2026-06-11 13:40:17.403+00	2026-06-11 14:00:10.27+00	{VIEW_SHOPS,VIEW_STATS,VIEW_REQUESTS,ONBOARD_SHOP,MANAGE_REQUESTS,SEED_DEMO,DELETE_SHOP,MANAGE_TEAM}	f
70908cc9-dd56-4507-968f-867d0c47eede	Master Admin	admin@oak-commerce.local	$2b$10$xAdt/Syd3eEUkVlhA2lvEedUIR6nfYI9tgiog1aNmwbcOORim3AHG	active	2026-06-19 14:07:33.307+00	2026-06-19 14:07:33.307+00	{SEED_DEMO}	t
\.


--
-- Data for Name: product_faqs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_faqs (id, shop_id, product_id, question, answer, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: product_gallery; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_gallery (id, shop_id, product_id, url, alt_text, sort_order, is_cover, created_at) FROM stdin;
\.


--
-- Data for Name: product_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_sections (id, shop_id, title, type, config, sort_order, is_active, created_at) FROM stdin;
3937aeca-a8c6-4fa8-a342-ec2f4fdd0cee	7a4606b0-d056-48ad-b449-86063da9da38	Featured Collections	grid	{"limit": 4}	1	t	2026-06-11 13:23:39.231+00
0e96676e-1c6a-4dc2-a117-983367c57ffb	488a8712-fc4e-4ef4-80f7-c004bfd88942	Featured Collections	grid	{"limit": 4}	1	t	2026-06-16 04:15:37.697+00
4d5ce7de-eda6-414d-80be-ea00dc0b84a8	a763e98a-9c50-496c-bf75-f16e7ad1d41e	Featured Collections	grid	{"limit": 4}	1	t	2026-06-16 04:15:54.724+00
7515915c-8213-4cbb-b7da-19c1567aa942	248e1b09-2c95-423b-b406-5ced4ca1a842	Featured Collections	grid	{"limit": 4}	1	t	2026-06-19 14:08:31.063+00
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, shop_id, product_id, sku, label, price, compare_price, cost_price, stock_qty, low_stock_at, image_url, total_sold, is_active, sort_order, created_at, updated_at) FROM stdin;
f374f74f-aa0d-40b1-ae16-cd1e00cf49f5	7a4606b0-d056-48ad-b449-86063da9da38	851b80ba-d357-4fc5-a0db-276576023522	test	Standard	800.00	1000.00	400.00	98	5	\N	0	t	0	2026-06-12 20:15:15.27+00	2026-06-13 16:15:48.053+00
b032752c-3ae2-4fdb-9473-15b087bd2f90	248e1b09-2c95-423b-b406-5ced4ca1a842	96335f78-52c3-4430-b423-860511ebf8b7	SAMPLE-TESTSHOP-MQL07XVF	Default Variant	99.00	\N	\N	100	5	\N	0	t	0	2026-06-19 14:08:31.037+00	2026-06-19 14:08:31.037+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, shop_id, category_id, brand_id, name, slug, description, short_desc, price, compare_price, cost_price, master_sku, status, is_featured, has_variants, tax_id, total_sold, meta_title, meta_description, custom_sections, created_at, updated_at) FROM stdin;
851b80ba-d357-4fc5-a0db-276576023522	7a4606b0-d056-48ad-b449-86063da9da38	ea6d8284-cc92-48ee-ba7f-9de1d0e88230	f006be22-0e75-4dab-ac84-a50023364994	test	test	\N	\N	800.00	1000.00	400.00	test	active	f	f	\N	0	\N	\N	[]	2026-06-12 19:32:41.555+00	2026-06-12 19:36:09.694+00
96335f78-52c3-4430-b423-860511ebf8b7	248e1b09-2c95-423b-b406-5ced4ca1a842	2da4c957-dda8-4f8a-86d3-f49de7eb00a4	\N	Sample Product	sample-product	This is a sample product created automatically to help you get started with your new storefront.	This is a sample product created automatically.	99.00	129.00	\N	\N	active	t	t	\N	0	\N	\N	[]	2026-06-19 14:08:31.005+00	2026-06-19 14:08:31.005+00
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, shop_id, product_id, customer_id, rating, title, body, status, created_at) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, shop_id, key, value, "group", updated_at) FROM stdin;
b13a0c35-33e6-4581-918a-56c657056009	7a4606b0-d056-48ad-b449-86063da9da38	about_tagline	AFTAB TEST	pages	2026-06-13 15:57:09.098+00
74b4b5c3-0e0a-4ede-a041-8826f8df6a1f	7a4606b0-d056-48ad-b449-86063da9da38	about_title	AFTAB	pages	2026-06-13 15:57:09.098+00
b418bed8-d6f7-4e85-98a9-31b10721a700	7a4606b0-d056-48ad-b449-86063da9da38	announcement_bar		pages	2026-06-13 15:57:09.098+00
61d84cfc-62d1-4f72-9165-ded15b2f439e	7a4606b0-d056-48ad-b449-86063da9da38	logo_url	https://maheorthe.com/wp-content/uploads/2023/12/maheorthe_logo.png	pages	2026-06-13 15:57:09.098+00
61ec4701-46bc-4e0d-baa4-057ec9bc4430	7a4606b0-d056-48ad-b449-86063da9da38	cta_btn1_text	jljhl	pages	2026-06-13 15:57:09.098+00
a29ce9e7-d953-4102-88e8-b70ba78c661b	7a4606b0-d056-48ad-b449-86063da9da38	navbar_menu	[{"title":"Home","url":"/"},{"title":"Products","url":"/products"},{"title":"Categories","url":"/categories"},{"title":"Contact Us","url":"/contact"},{"title":"About Us","url":"/about"}]	pages	2026-06-13 15:57:09.098+00
7af01c7c-dc4d-4724-98c1-1b0860439401	248e1b09-2c95-423b-b406-5ced4ca1a842	store_name	Test Shop	general	2026-06-19 14:08:30.915+00
e98e9c22-2faa-47fb-9430-a6fa2e4d4be2	248e1b09-2c95-423b-b406-5ced4ca1a842	store_email	owner@testShop.localhost	general	2026-06-19 14:08:30.915+00
9f651610-b81b-4a7e-ac42-e859d5e75885	248e1b09-2c95-423b-b406-5ced4ca1a842	store_currency	INR	general	2026-06-19 14:08:30.915+00
66e944f1-4f09-4296-907f-78c3d5cf24bd	248e1b09-2c95-423b-b406-5ced4ca1a842	store_timezone	Asia/Kolkata	general	2026-06-19 14:08:30.915+00
58f3bd75-4cc6-4226-81f0-3bed4cb58162	248e1b09-2c95-423b-b406-5ced4ca1a842	store_status	active	general	2026-06-19 14:08:30.915+00
\.


--
-- Data for Name: shipping_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shipping_rates (id, shop_id, name, rate, free_above, zone_label, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: shop_domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shop_domains (id, shop_id, domain, type, is_primary, status, verified_at, created_at) FROM stdin;
77944744-e906-4bd7-9650-e848e67fbb48	7a4606b0-d056-48ad-b449-86063da9da38	TEST.posix.digital	subdomain	t	active	2026-06-11 13:23:39.156+00	2026-06-11 13:23:39.16+00
b566254a-86fa-4713-9d02-972ab61351c1	7a4606b0-d056-48ad-b449-86063da9da38	aftab.localhost	subdomain	t	active	2026-06-12 16:14:09.721+00	2026-06-12 16:14:09.736+00
a4da81ba-1b3c-4b22-a8e1-73bc485016c0	488a8712-fc4e-4ef4-80f7-c004bfd88942	aaa.posix.digital	subdomain	t	active	2026-06-16 04:15:37.657+00	2026-06-16 04:15:37.66+00
a9b21c81-eb8f-40b3-97e5-e14a287ad7fd	a763e98a-9c50-496c-bf75-f16e7ad1d41e	vdavav.posix.digital	subdomain	t	active	2026-06-16 04:15:54.703+00	2026-06-16 04:15:54.703+00
af62876b-7e19-45a2-803d-70ce823f0b23	248e1b09-2c95-423b-b406-5ced4ca1a842	testShop.localhost	subdomain	t	active	2026-06-19 14:08:30.71+00	2026-06-19 14:08:30.715+00
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shops (id, name, slug, owner_id, plan, status, logo_url, description, currency, timezone, created_at, updated_at, db_connection_url) FROM stdin;
7a4606b0-d056-48ad-b449-86063da9da38	Aftab Store	aftab	1311c1a5-72fe-4c5c-9b07-70b39e01aaf3	starter	active	\N	\N	INR	Asia/Kolkata	2026-06-11 13:23:39.124+00	2026-06-12 16:14:09.707+00	\N
488a8712-fc4e-4ef4-80f7-c004bfd88942	aaa	aaa	5647d2f6-ae81-4957-9e4d-ea547cfedd23	starter	active	\N	\N	INR	Asia/Kolkata	2026-06-16 04:15:37.591+00	2026-06-16 04:15:37.685+00	\N
a763e98a-9c50-496c-bf75-f16e7ad1d41e	vdavav	vdavav	66bce0cd-4b4e-44bd-97ac-efee2e972cac	starter	active	\N	\N	INR	Asia/Kolkata	2026-06-16 04:15:54.674+00	2026-06-16 04:15:54.717+00	\N
248e1b09-2c95-423b-b406-5ced4ca1a842	Test Shop	testShop	757f0859-4cd8-4a79-97fb-633e4b84af3e	starter	active	\N	\N	INR	Asia/Kolkata	2026-06-19 14:08:30.703+00	2026-06-19 14:08:30.891+00	\N
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, key, value, description, is_public, updated_at) FROM stdin;
9325909f-95ac-4929-a4d0-bb138a67e1ec	global_theme	dark	Default platform theme setting	t	2026-06-19 14:08:31.13+00
2f02f510-fe83-4c66-a125-223f4c9cd757	platform_maintenance	false	Maintenance mode status flag	t	2026-06-19 14:08:31.149+00
\.


--
-- Data for Name: taxes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.taxes (id, shop_id, name, rate, type, is_inclusive, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: tenant_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_requests (id, name, slug, owner_name, owner_email, phone, category, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, shop_id, name, email, password_hash, password, role, avatar_url, is_active, last_login_at, created_at, updated_at) FROM stdin;
1311c1a5-72fe-4c5c-9b07-70b39e01aaf3	7a4606b0-d056-48ad-b449-86063da9da38	OAKSOL	aftab@oaksol.in	$2b$10$placeholder_hash_value	TEST@OakSol2026	owner	\N	t	\N	2026-06-11 13:23:39.172+00	2026-06-11 13:23:39.172+00
5647d2f6-ae81-4957-9e4d-ea547cfedd23	488a8712-fc4e-4ef4-80f7-c004bfd88942	aa	aaa@gnmail.com	$2b$10$placeholder_hash_value	aaa@OakSol2026	owner	\N	t	\N	2026-06-16 04:15:37.672+00	2026-06-16 04:15:37.672+00
66bce0cd-4b4e-44bd-97ac-efee2e972cac	a763e98a-9c50-496c-bf75-f16e7ad1d41e	bsb	bsbfsfhb@gmail.com	$2b$10$placeholder_hash_value	vdavav@OakSol2026	owner	\N	t	\N	2026-06-16 04:15:54.711+00	2026-06-16 04:15:54.711+00
757f0859-4cd8-4a79-97fb-633e4b84af3e	248e1b09-2c95-423b-b406-5ced4ca1a842	Demo Shop Owner	owner@testShop.localhost	$2b$10$uI0uSpx2Ihl45VVd1VjtPOV1Tccjhxi0z2tfiMKW0gJUlKZhS8wZu	ShopOwner@123	owner	\N	t	\N	2026-06-19 14:08:30.866+00	2026-06-19 14:08:30.866+00
\.


--
-- Data for Name: variant_attributes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.variant_attributes (id, shop_id, variant_id, attr_key, attr_value, sort_order) FROM stdin;
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouses (id, shop_id, name, address, is_active, created_at) FROM stdin;
d41810da-5731-4a89-b812-4d5fdffaf7f0	248e1b09-2c95-423b-b406-5ced4ca1a842	Main Warehouse	\N	t	2026-06-19 14:08:30.963+00
\.


--
-- Data for Name: widgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.widgets (id, page_id, type, sort_order, content, styles, created_at, updated_at) FROM stdin;
905d7506-709c-44f6-a644-60be1dd5970a	fb22af79-0440-4ecb-948e-7ef2655239a3	HERO_BANNER	0	{"title": "New Hero Section", "slides": [{"title": "New Hero Section", "layout": "split_product", "subtitle": "Add a subtitle here", "textAlign": "center", "buttonLink": "/products", "buttonText": "Shop Now", "backgroundImageUrl": ""}], "subtitle": "Add a subtitle here", "buttonLink": "/products", "buttonText": "Shop Now", "backgroundImageUrl": ""}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-16 04:29:31.905+00	2026-06-16 04:29:31.905+00
fda66a06-2bfc-4b20-ade3-fb60a29b683a	fb22af79-0440-4ecb-948e-7ef2655239a3	TESTIMONIALS	1	{"title": "What Our Customers Say", "subtitle": "Real reviews from real customers", "testimonials": [{"id": "1", "date": "June 10, 2026", "name": "Alia Bhatt", "role": "Verified Buyer", "text": "This store has the absolute best organic face washes. My skin feels fresh, clear, and rejuvenated. Highly recommended!", "rating": 5, "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"}, {"id": "2", "date": "June 12, 2026", "name": "Kabir Sen", "role": "Verified Buyer", "text": "Fantastic customer support and extremely fast delivery. The lavender hair oil smells divine and works wonders.", "rating": 5, "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"}, {"id": "3", "date": "June 13, 2026", "name": "Robert J.", "role": "Verified Buyer", "text": "Very good quality products. The packaging is eco-friendly and premium. Will definitely buy again!", "rating": 4, "avatarUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150"}]}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-16 04:29:31.905+00	2026-06-16 04:29:31.905+00
7d0d49f2-0ff3-4a40-82c3-088b1e175369	33543214-0b9d-4f70-8433-6239b061e40a	hero-banner	1	{"title": "Welcome to Test Shop", "subtitle": "Explore our amazing new products!", "image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200"}	{"paddingY": "60px", "textAlign": "center"}	2026-06-19 14:08:31.106+00	2026-06-19 14:08:31.106+00
2ad2ee03-89c3-4e27-b171-5ea928b97899	bb99e52d-6ee7-4d35-bd27-a7c0a20939df	HERO_BANNER	0	{"title": "Shop / Product Listing", "slides": [{"title": "Shop / Product Listing", "subtitle": "Welcome to our shop / product listing page.", "textAlign": "center", "buttonLink": "", "buttonText": "", "backgroundImageUrl": "https://maheorthe.com/wp-content/uploads/2023/12/image17.png"}], "subtitle": "Welcome to our shop / product listing page.", "buttonLink": "", "buttonText": "", "backgroundImageUrl": ""}	{"paddingTop": "0px", "paddingBottom": "0px"}	2026-06-13 15:36:04.684+00	2026-06-13 15:36:04.684+00
b5d7605f-0e02-4cde-928f-85a3ba3711a4	244709e3-2649-4740-9772-6b921fdda677	HERO_BANNER	0	{"title": "Category Details", "slides": [{"title": "Category Details", "subtitle": "Welcome to our category details page.", "textAlign": "center", "buttonLink": "", "buttonText": "", "backgroundImageUrl": "https://maheorthe.com/wp-content/uploads/2023/12/image17.png"}], "subtitle": "Welcome to our category details page.", "buttonLink": "", "buttonText": "", "backgroundImageUrl": ""}	{"paddingTop": "0px", "paddingBottom": "0px"}	2026-06-13 15:39:22.118+00	2026-06-13 15:39:22.118+00
cf358265-5f06-4001-aa14-14328835ac76	58475c41-0b1e-4534-9d85-8cb35d86c9b2	HERO_BANNER	0	{"title": "About Us", "subtitle": "Welcome to our about us page.", "buttonLink": "", "buttonText": "", "backgroundImageUrl": ""}	{"paddingTop": "0px", "paddingBottom": "0px"}	2026-06-13 15:55:37.613+00	2026-06-13 15:55:37.613+00
44833395-0865-4c89-bb8c-05f72165995a	a0d28f4d-ddbf-4503-89c7-696fb3be92a8	HERO_BANNER	0	{"title": "New Hero Section", "slides": [{"title": "New Hero Section", "layout": "split_product", "subtitle": "Add a subtitle here", "textAlign": "center", "textColor": "#212c27", "buttonLink": "/products", "buttonText": "Shop Now", "slideBgColor": "#fafafa", "backgroundImageUrl": "https://maheorthe.com/wp-content/uploads/2023/12/image17.png"}], "subtitle": "Add a subtitle here", "buttonLink": "/products", "buttonText": "Shop Now", "backgroundImageUrl": ""}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-13 15:57:09.171+00	2026-06-13 15:57:09.171+00
7b38b97b-38fa-4ce7-a64c-680aba9bb238	a0d28f4d-ddbf-4503-89c7-696fb3be92a8	TESTIMONIALS	1	{"title": "What Our Customers Say", "subtitle": "Real reviews from real customers", "testimonials": [{"id": "1", "date": "June 10, 2026", "name": "Alia Bhatt", "role": "Verified Buyer", "text": "This store has the absolute best organic face washes. My skin feels fresh, clear, and rejuvenated. Highly recommended!", "rating": 5, "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"}, {"id": "2", "date": "June 12, 2026", "name": "Kabir Sen", "role": "Verified Buyer", "text": "Fantastic customer support and extremely fast delivery. The lavender hair oil smells divine and works wonders.", "rating": 5, "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"}, {"id": "3", "date": "June 13, 2026", "name": "Robert J.", "role": "Verified Buyer", "text": "Very good quality products. The packaging is eco-friendly and premium. Will definitely buy again!", "rating": 4, "avatarUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150"}]}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-13 15:57:09.171+00	2026-06-13 15:57:09.171+00
94e6d53a-2748-4b8a-9205-72a34cd4c7ed	a0d28f4d-ddbf-4503-89c7-696fb3be92a8	PROMO_GRID	2	{"cards": [{"title": "Hair Care", "bgColor": "#f1f5f9", "subtitle": "100% Natural Oils", "textColor": "#0f172a", "buttonLink": "/products", "buttonText": "Shop Now", "imgPosition": "right", "backgroundImageUrl": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=600"}, {"title": "Body Care", "bgColor": "#f1f5f9", "subtitle": "Chemical Free Lotions", "textColor": "#0f172a", "buttonLink": "/products", "buttonText": "Shop Now", "imgPosition": "right", "backgroundImageUrl": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=600"}, {"title": "Skin Care", "bgColor": "#f1f5f9", "subtitle": "Organic Facewashes", "textColor": "#0f172a", "buttonLink": "/products", "buttonText": "Shop Now", "imgPosition": "right", "backgroundImageUrl": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600"}], "title": "Complete Skin & Hair Solutions", "layout": "3-columns", "subtitle": "Explore our premium organic products"}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-13 15:57:09.171+00	2026-06-13 15:57:09.171+00
00e432fd-4ff1-41c9-8522-7670e4fe534b	a0d28f4d-ddbf-4503-89c7-696fb3be92a8	TEXT_BLOCK	3	{"body": "<p>Edit content here...</p>", "title": "Section Title", "imageUrl": "https://maheorthe.com/wp-content/uploads/2025/08/Untitled_design__11_-300x300.png", "imagePosition": "right"}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-13 15:57:09.171+00	2026-06-13 15:57:09.171+00
0bdcde74-3524-44ae-adb5-04f6c15f75cb	a0d28f4d-ddbf-4503-89c7-696fb3be92a8	BEST_SELLERS	4	{"title": "Best Sellers", "subtitle": "Our most popular organic products", "productIds": []}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-13 15:57:09.171+00	2026-06-13 15:57:09.171+00
3d95d27a-24bc-4058-809c-495e5b3d0ba1	a0d28f4d-ddbf-4503-89c7-696fb3be92a8	CATEGORIES_LIST	5	{"title": "Product Categories", "subtitle": "Explore our curated collections", "showViewAll": true}	{"paddingTop": "2rem", "paddingBottom": "2rem"}	2026-06-13 15:57:09.171+00	2026-06-13 15:57:09.171+00
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: inventory_logs inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_logs order_status_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_logs
    ADD CONSTRAINT order_status_logs_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: payment_gateways payment_gateways_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_gateways
    ADD CONSTRAINT payment_gateways_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);


--
-- Name: product_faqs product_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_faqs
    ADD CONSTRAINT product_faqs_pkey PRIMARY KEY (id);


--
-- Name: product_gallery product_gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_gallery
    ADD CONSTRAINT product_gallery_pkey PRIMARY KEY (id);


--
-- Name: product_sections product_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_sections
    ADD CONSTRAINT product_sections_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: shipping_rates shipping_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT shipping_rates_pkey PRIMARY KEY (id);


--
-- Name: shop_domains shop_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_domains
    ADD CONSTRAINT shop_domains_pkey PRIMARY KEY (id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT taxes_pkey PRIMARY KEY (id);


--
-- Name: tenant_requests tenant_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_requests
    ADD CONSTRAINT tenant_requests_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: variant_attributes variant_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant_attributes
    ADD CONSTRAINT variant_attributes_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: widgets widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_pkey PRIMARY KEY (id);


--
-- Name: brands_shop_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX brands_shop_id_slug_key ON public.brands USING btree (shop_id, slug);


--
-- Name: cart_items_cart_id_variant_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cart_items_cart_id_variant_id_key ON public.cart_items USING btree (cart_id, variant_id);


--
-- Name: carts_session_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX carts_session_id_key ON public.carts USING btree (session_id);


--
-- Name: categories_shop_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_shop_id_slug_key ON public.categories USING btree (shop_id, slug);


--
-- Name: coupons_shop_id_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX coupons_shop_id_code_key ON public.coupons USING btree (shop_id, code);


--
-- Name: customers_guest_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_guest_token_key ON public.customers USING btree (guest_token);


--
-- Name: customers_shop_id_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_shop_id_email_key ON public.customers USING btree (shop_id, email);


--
-- Name: idx_activity_shop_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_shop_time ON public.activity_logs USING btree (shop_id, created_at DESC);


--
-- Name: idx_cart_items_cart; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_items_cart ON public.cart_items USING btree (cart_id);


--
-- Name: idx_cart_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_session ON public.carts USING btree (session_id);


--
-- Name: idx_customers_shop; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_shop ON public.customers USING btree (shop_id);


--
-- Name: idx_inventory_variant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_variant ON public.inventory_logs USING btree (variant_id);


--
-- Name: idx_notifications_cust; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_cust ON public.notifications USING btree (customer_id, is_read);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_number ON public.orders USING btree (order_number);


--
-- Name: idx_orders_shop; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_shop ON public.orders USING btree (shop_id);


--
-- Name: idx_payments_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);


--
-- Name: idx_products_shop; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_shop ON public.products USING btree (shop_id);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id);


--
-- Name: idx_shop_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shop_domain ON public.shop_domains USING btree (domain);


--
-- Name: idx_variant_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_variant_stock ON public.product_variants USING btree (shop_id, stock_qty);


--
-- Name: idx_variants_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_variants_product ON public.product_variants USING btree (product_id);


--
-- Name: idx_variants_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_variants_sku ON public.product_variants USING btree (sku);


--
-- Name: orders_order_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);


--
-- Name: orders_shop_id_order_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX orders_shop_id_order_number_key ON public.orders USING btree (shop_id, order_number);


--
-- Name: pages_shop_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pages_shop_id_slug_key ON public.pages USING btree (shop_id, slug);


--
-- Name: payments_transaction_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_transaction_id_key ON public.payments USING btree (transaction_id);


--
-- Name: platform_admins_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX platform_admins_email_key ON public.platform_admins USING btree (email);


--
-- Name: product_variants_sku_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);


--
-- Name: products_shop_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX products_shop_id_slug_key ON public.products USING btree (shop_id, slug);


--
-- Name: settings_shop_id_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX settings_shop_id_key_key ON public.settings USING btree (shop_id, key);


--
-- Name: shop_domains_domain_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX shop_domains_domain_key ON public.shop_domains USING btree (domain);


--
-- Name: shops_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX shops_slug_key ON public.shops USING btree (slug);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: tenant_requests_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenant_requests_slug_key ON public.tenant_requests USING btree (slug);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: activity_logs activity_logs_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: addresses addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addresses addresses_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: banners banners_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: brands brands_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: carts carts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupons coupons_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customers customers_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_logs inventory_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_logs inventory_logs_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_logs inventory_logs_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_logs inventory_logs_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_logs
    ADD CONSTRAINT inventory_logs_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_status_logs order_status_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_logs
    ADD CONSTRAINT order_status_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: order_status_logs order_status_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_logs
    ADD CONSTRAINT order_status_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_status_logs order_status_logs_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_logs
    ADD CONSTRAINT order_status_logs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_shipping_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shipping_rate_id_fkey FOREIGN KEY (shipping_rate_id) REFERENCES public.shipping_rates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pages pages_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_gateways payment_gateways_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_gateways
    ADD CONSTRAINT payment_gateways_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_gateway_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_gateway_id_fkey FOREIGN KEY (gateway_id) REFERENCES public.payment_gateways(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_faqs product_faqs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_faqs
    ADD CONSTRAINT product_faqs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_faqs product_faqs_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_faqs
    ADD CONSTRAINT product_faqs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_gallery product_gallery_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_gallery
    ADD CONSTRAINT product_gallery_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_gallery product_gallery_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_gallery
    ADD CONSTRAINT product_gallery_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_sections product_sections_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_sections
    ADD CONSTRAINT product_sections_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_tax_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_tax_id_fkey FOREIGN KEY (tax_id) REFERENCES public.taxes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reviews reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: settings settings_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_rates shipping_rates_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT shipping_rates_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shop_domains shop_domains_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_domains
    ADD CONSTRAINT shop_domains_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shops shops_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: taxes taxes_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.taxes
    ADD CONSTRAINT taxes_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variant_attributes variant_attributes_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant_attributes
    ADD CONSTRAINT variant_attributes_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: variant_attributes variant_attributes_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant_attributes
    ADD CONSTRAINT variant_attributes_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: warehouses warehouses_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: widgets widgets_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qQbcq6ef9aG8RBAaQu5DFAg2tEsPJqP3OtsSzmeMo5WcAaDPIk2r3ml4WbDAbXd

