import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../../../lib/authOptions';
import { ProductService } from '@/lib/services/productService';
import { prisma } from '@/lib/prisma';
import { ImageService } from '@/lib/services/imageService';
import { sendPasswordResetEmail, sendCustomerEmail } from '@/lib/services/emailService';
import jwt from 'jsonwebtoken';

// Use the new GoogleGenAI SDK
// Docs: import { GoogleGenAI } from "@google/genai";

const getTools = (enableImageGen: boolean) => {
    const tools: any[] = [
        {
            functionDeclarations: [
                {
                    name: 'listProducts',
                    description: 'List products with optional filtering. Use this to scout the inventory, explore categories, or verify product details. Returns id, name, price, stock, image URL, and category.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            search: { type: "STRING", description: 'Search term for product name' },
                            category: { type: "STRING", description: 'Filter by category (e.g. "Vehicles", "Clothing")' },
                            subcategory: { type: "STRING", description: 'Filter by subcategory' },
                            latest: { type: "BOOLEAN", description: 'If true, returns the most recently created products first.' },
                            page: { type: "NUMBER", description: 'Page number (default 1)' },
                            limit: { type: "NUMBER", description: 'Items per page (default 20, max 50)' }
                        },
                    },
                },
                {
                    name: 'createProduct',
                    description: 'Create a new product. Use this when the user wants to add an item to the store. If keys "size" and "color" are present in options, they should be mapped to the options array.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING", description: 'Product name' },
                            price: { type: "NUMBER", description: 'Price in Taka' },
                            itemDescription: { type: "STRING", description: 'Product description' },
                            category: { type: "STRING", description: 'Category' },
                            subcategory: { type: "STRING", description: 'Subcategory' },
                            stock: { type: "NUMBER", description: 'Stock quantity' },
                            image: { type: "STRING", description: 'Main product image URL. Optional if variants with images are provided.' },
                            images: {
                                type: "ARRAY",
                                items: { type: "STRING" },
                                description: 'Additional image URLs'
                            },
                            options: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        name: { type: "STRING", description: "Option name (e.g. Color, Size)" },
                                        values: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    name: { type: "STRING", description: "Value name (e.g. Red, XL)" },
                                                    image: { type: "STRING", description: "Optional image URL for this specific value" }
                                                }
                                            }
                                        }
                                    }
                                },
                                description: 'Product variants/options'
                            }
                        },
                        required: ['name', 'price', 'category', 'stock'],
                    },
                },
                {
                    name: 'updateProduct',
                    description: 'Update an existing product. Use this to fix details or modify variants. IMPORTANT: By default, options are merged. Set replaceOptions=true to DELETE existing options and replace them with the new list.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            id: { type: "NUMBER", description: 'Product ID' },
                            name: { type: "STRING" },
                            price: { type: "NUMBER" },
                            stock: { type: "NUMBER" },
                            description: { type: "STRING" },
                            category: { type: "STRING" },
                            subcategory: { type: "STRING" },
                            image: { type: "STRING", description: "Main product image URL" },
                            images: {
                                type: "ARRAY",
                                items: { type: "STRING" },
                                description: "List of additional image URLs. NOTE: This replaces the existing list."
                            },
                            options: {
                                type: "ARRAY",
                                description: "Options to add or update. Structure: [{name: 'Color', values: [{name: 'Red', image: '...'}]}]",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        name: { type: "STRING", description: "Option name (e.g. Color)" },
                                        values: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    name: { type: "STRING", description: "Value name (e.g. Red)" },
                                                    image: { type: "STRING", description: "Optional image for this variant" }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            replaceOptions: {
                                type: "BOOLEAN",
                                description: "If true, existing options are deleted and replaced by the provided options list. Use with CAUTION."
                            },
                            isArchived: {
                                type: "BOOLEAN",
                                description: "Set to true to archive (hide) the product, false to unarchive."
                            }
                        },
                        required: ['id'],
                    },
                },
                {
                    name: 'deleteProduct',
                    description: 'Permanently delete a product. Use this CAREFULLY. The system will prevent deletion if the product is part of any existing orders.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            id: { type: "NUMBER", description: "Product ID to delete" }
                        },
                        required: ['id']
                    }
                },
                {
                    name: 'getArchivedProducts',
                    description: 'Get a list of all products that are currently archived. Returns product IDs and basic details.',
                    parameters: {
                        type: "OBJECT",
                        properties: {},
                    },
                },
                {
                    name: 'getProductDetails',
                    description: 'Get full details of a specific product by ID, regardless of its archived status. Use this to check stock, price, or options for a specific item id.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            id: { type: "NUMBER", description: "Product ID" }
                        },
                        required: ['id']
                    },
                },
                {
                    name: 'getSiteStats',
                    description: 'Get high-level site statistics. Use this to understand the store performance and inventory state before making changes.',
                    parameters: {
                        type: "OBJECT",
                        properties: {},
                    },
                },
                {
                    name: 'inspectProductImage',
                    description: 'Fetch and visually "see" a product image. Use this when you need to analyze the visual appearance (style, color, shape) of a specific product or reference image from its URL. Returns the image data to your vision center.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            id: { type: "NUMBER", description: "Product ID (optional if imageUrl provided)" },
                            imageUrl: { type: "STRING", description: "Direct URL of the image to inspect" }
                        },
                    },
                },
                {
                    name: 'rotateLocalImage',
                    description: 'Pre-flight Tool: Rotates a base64 image string by 90, 180, or 270 degrees. Returns the new rotated base64 string. Use this BEFORE creating a product if the user says an uploaded image has wrong orientation.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            base64Data: { type: "STRING", description: "The raw base64 string of the image" },
                            degrees: { type: "NUMBER", description: "Rotation in degrees (90, 180, 270)" }
                        },
                        required: ['base64Data', 'degrees']
                    }
                },
                {
                    name: 'updateProductRotation',
                    description: 'Post-flight Tool: Updates the rotation metadata for an EXISTING product image. Does NOT change the image link, only how it is displayed. Set rotation to 0 to RESET.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            id: { type: "NUMBER", description: "Product ID" },
                            rotation: { type: "NUMBER", description: "Rotation degrees for the main image (e.g., 90)" },
                            optionValueId: { type: "STRING", description: "Optional: If rotating a specific variant image, provide the OptionValue ID" }
                        },
                        required: ['id', 'rotation']
                    }
                }
            ]
        },
        {

            functionDeclarations: [
                {
                    name: 'listOrders',
                    description: 'Search and filter orders. Use this to find specific orders or view recent activity.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            status: { type: "STRING", description: 'Filter by status (PENDING, PROCESSING, SHIPPING, COMPLETED, CANCELLED)' },
                            search: { type: "STRING", description: 'Search by Order ID (numeric), Customer Name, or Email' },
                            limit: { type: "NUMBER", description: 'Number of orders per page (default 20)' },
                            page: { type: "NUMBER", description: 'Page number (default 1)' }
                        },
                    },
                },
                {
                    name: 'updateOrderStatus',
                    description: 'Update the status of an order.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            orderId: { type: "NUMBER", description: 'Order ID' },
                            status: { type: "STRING", description: 'New Status (PENDING, PROCESSING, SHIPPING, COMPLETED, CANCELLED)' }
                        },
                        required: ['orderId', 'status']
                    }
                },
                {
                    name: 'cancelOrder',
                    description: 'Cancel an order.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            orderId: { type: "NUMBER", description: 'Order ID' }
                        },
                        required: ['orderId']
                    }
                },
                {
                    name: 'deleteOrder',
                    description: 'Permanently delete an order. Only use this if the order is already cancelled or completed and the user explicitly requests removal.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            orderId: { type: "NUMBER", description: 'Order ID' },
                            confirm: { type: "BOOLEAN", description: 'Set to true to confirm deletion' }
                        },
                        required: ['orderId', 'confirm']
                    }
                },
                {
                    name: 'getOrderDetails',
                    description: 'Get full details of a specific order, including line items and shipping info.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            orderId: { type: "NUMBER", description: 'Order ID' }
                        },
                        required: ['orderId']
                    }
                },
                {
                    name: 'listCustomers',
                    description: 'Search for customers by name or email, or find top spenders.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            search: { type: "STRING", description: 'Name or email to search' },
                            limit: { type: "NUMBER", description: 'Limit results (default 20)' },
                            page: { type: "NUMBER", description: 'Page number (default 1)' }
                        }
                    }
                },
                {
                    name: 'resetCustomerPassword',
                    description: 'Trigger a password reset email for a customer. Use this when a user asks to reset their password.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            email: { type: "STRING", description: 'Customer email address' }
                        },
                        required: ['email']
                    }
                },
                {
                    name: 'unlockCustomerAccount',
                    description: 'Unlock a customer account that has been restricted.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            email: { type: "STRING", description: 'Customer email address' }
                        },
                        required: ['email']
                    }
                },
                {
                    name: 'messageCustomer',
                    description: 'Send an email message to a customer.',
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            email: { type: "STRING", description: 'Customer email' },
                            subject: { type: "STRING", description: 'Email subject' },
                            message: { type: "STRING", description: 'Email body content' }
                        },
                        required: ['email', 'subject', 'message']
                    }
                },
                // Tool: Create Coupon
                {
                    name: 'createCoupon',
                    description: 'Create a new discount coupon code programmatically.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            code: { type: 'STRING', description: 'The unique coupon code (e.g., SUMMER20).' },
                            discountType: { type: 'STRING', description: 'Type of discount: PERCENTAGE or FIXED.', enum: ['PERCENTAGE', 'FIXED'] },
                            discountValue: { type: 'NUMBER', description: 'The value of the discount.' },
                            minOrderAmount: { type: 'NUMBER', description: 'Minimum order amount to apply the coupon.' },
                            expiresInDays: { type: 'NUMBER', description: 'Days until the coupon expires.' },
                        },
                        required: ['code', 'discountType', 'discountValue'],
                    },
                },
                // Tool: Get Wishlist Insights
                {
                    name: 'getWishlistInsights',
                    description: 'Analyze user wishlists to find popular products.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            limit: { type: 'NUMBER', description: 'Number of top products to return (default 5).' },
                        },
                    },
                },
                // Tool: Send Targeted Email
                {
                    name: 'sendTargetedEmail',
                    description: 'Send a targeted email to a specific user (by email).',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            email: { type: 'STRING', description: 'The recipient email address.' },
                            subject: { type: 'STRING', description: 'Email subject line.' },
                            message: { type: 'STRING', description: 'Email body content (can be HTML).' },
                        },
                        required: ['email', 'subject', 'message'],
                    },
                },
                // Tool: List Coupons
                {
                    name: 'listCoupons',
                    description: 'List all coupons or search for specific coupons.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            search: { type: 'STRING', description: 'Search term for coupon code.' },
                            activeOnly: { type: 'BOOLEAN', description: 'If true, only return active coupons.' },
                            limit: { type: 'NUMBER', description: 'Number of coupons to return (default 20).' },
                        },
                    },
                },
                // Tool: Update Coupon
                {
                    name: 'updateCoupon',
                    description: 'Update an existing coupon by ID or code.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            id: { type: 'STRING', description: 'Coupon ID to update.' },
                            code: { type: 'STRING', description: 'Coupon code to update (used if ID not provided).' },
                            discountType: { type: 'STRING', description: 'New discount type: PERCENTAGE or FIXED.', enum: ['PERCENTAGE', 'FIXED'] },
                            discountValue: { type: 'NUMBER', description: 'New discount value.' },
                            minOrderAmount: { type: 'NUMBER', description: 'New minimum order amount.' },
                            maxDiscountAmount: { type: 'NUMBER', description: 'Maximum discount amount (for percentage coupons).' },
                            usageLimit: { type: 'NUMBER', description: 'New usage limit.' },
                            isActive: { type: 'BOOLEAN', description: 'Set coupon active/inactive.' },
                            expiresInDays: { type: 'NUMBER', description: 'Days from now until expiry (overrides current).' },
                        },
                    },
                },
                // Tool: Delete Coupon
                {
                    name: 'deleteCoupon',
                    description: 'Permanently delete a coupon by ID or code.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            id: { type: 'STRING', description: 'Coupon ID to delete.' },
                            code: { type: 'STRING', description: 'Coupon code to delete (used if ID not provided).' },
                        },
                    },
                },
            ]
        }
    ];

    if (enableImageGen) {
        tools[0].functionDeclarations.push({
            name: 'generateImage',
            description: 'Generate or edit an image based on a text prompt. Use this when the user asks to create an image or edit one (e.g. remove background). RETURNS A BASE64 IMAGE for user review.',
            parameters: {
                type: "OBJECT",
                properties: {
                    prompt: { type: "STRING", description: "Detailed description of the image to generate" },
                    base64Image: { type: "STRING", description: "Optional: Base64 string of the source image if editing" },
                    imageUrl: { type: "STRING", description: "Optional: URL of an image to use as a reference/source. Use this if the user refers to a previously uploaded or existing product image." }
                },
                required: ['prompt']
            }
        });
    }

    tools[0].functionDeclarations.push({
        name: 'getToolDocumentation',
        description: 'Get detailed documentation for specific tools or all tools. Use this when you need to know how to use a function or what parameters it accepts.',
        parameters: {
            type: "OBJECT",
            properties: {
                toolName: { type: "STRING", description: "Optional: The name of the tool to get documentation for. If omitted, returns all tools." }
            }
        }
    });

    return tools;
};

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
};

// Helper function to execute tool calls
async function executeToolCall(name: string, args: any, client: any, enableQC: boolean, modelId: string) {
    let apiResponse;
    const extraParts: any[] = []; // For images returned by tools to the model (e.g., inspectProductImage)
    let pendingImageGeneration = null; // For image generation results

    // Helper to safely get numeric Product ID from composite search IDs (e.g. "23-abc")
    const getSafeProductId = (id: any): number => {
        if (typeof id === 'number') return id;
        if (typeof id === 'string') {
            const part = id.split('-')[0];
            return parseInt(part, 10);
        }
        return NaN;
    };

    console.log(`[Agent] Executing tool: ${name} `, args);

    try {
        switch (name) {
            case 'listProducts': {
                const limit = (args?.limit as number) || 20;
                const page = (args?.page as number) || 1;
                const { products, total } = await ProductService.getProducts({
                    search: args?.search as string,
                    category: args?.category as string,
                    subcategory: args?.subcategory as string,
                    latest: args?.latest as boolean,
                    isAdmin: true,
                    isArchived: false,
                    page,
                    limit
                });
                apiResponse = {
                    products: products.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        stock: p.stock,
                        image: p.image,
                        category: p.category,
                        subcategory: p.subcategory,
                        images: p.images,
                        description: p.description,
                        options: p.options
                    })),
                    pagination: {
                        totalItems: total,
                        totalPages: Math.ceil(total / limit),
                        currentPage: page,
                        itemsPerPage: limit
                    }
                };
                break;
            }
            case 'createProduct':
                const newProduct = await ProductService.createProduct({
                    name: args?.name as string,
                    price: args?.price as number,
                    description: args?.itemDescription as string,
                    category: args?.category as string,
                    subcategory: args?.subcategory as string,
                    stock: args?.stock as number,
                    image: args?.image as string,
                    isArchived: false,
                    images: args?.images as string[] || [],
                    options: args?.options as any || []
                });
                apiResponse = { success: true, productArr: [newProduct] };
                break;
            case 'updateProduct':
                const safeId = getSafeProductId(args?.id);
                if (isNaN(safeId)) {
                    throw new Error(`Invalid Product ID formatting: ${args?.id}. Ensure you are using the ID returned by listProducts.`);
                }
                await ProductService.updateProduct({
                    id: safeId,
                    name: args?.name as string,
                    price: args?.price as number,
                    stock: args?.stock as number,
                    description: args?.description as string,
                    category: args?.category as string,
                    subcategory: args?.subcategory as string,
                    image: args?.image as string,
                    images: args?.images as string[],
                    options: args?.options as any,
                    replaceOptions: args?.replaceOptions as boolean,
                    isArchived: args?.isArchived as boolean
                });
                apiResponse = { success: true, id: safeId };
                break;
            case 'deleteProduct':
                const delId = getSafeProductId(args?.id);
                if (isNaN(delId)) {
                    throw new Error(`Invalid Product ID formatting: ${args?.id}`);
                }
                const orderCount = await prisma.orderItem.count({
                    where: { productId: delId }
                });

                if (orderCount > 0) {
                    apiResponse = { success: false, error: "Cannot delete product because it is part of existing orders. Consider archiving it instead." };
                } else {
                    await prisma.product.delete({
                        where: { id: delId }
                    });
                    apiResponse = { success: true, message: "Product deleted successfully." };
                }
                break;
            case 'getArchivedProducts':
                const archivedProducts = await prisma.product.findMany({
                    where: { isArchived: true },
                    select: { id: true, name: true, price: true, stock: true, image: true, category: true }
                });
                apiResponse = { products: archivedProducts };
                break;
            case 'getProductDetails':
                const prodId = getSafeProductId(args?.id);
                if (isNaN(prodId)) throw new Error(`Invalid Product ID: ${args?.id}`);

                const productDetails = await prisma.product.findUnique({
                    where: { id: prodId },
                    include: { options: { include: { values: true } } }
                });

                if (!productDetails) {
                    apiResponse = { success: false, error: "Product not found." };
                } else {
                    apiResponse = { product: productDetails };
                }
                break;
            case 'getSiteStats':
                const [
                    totalOrders,
                    revenueResult,
                    ordersByStatus,
                    recentOrders,
                    totalProducts,
                    lowStockProducts,
                    outOfStockProducts,
                    customers
                ] = await Promise.all([
                    prisma.order.count(),
                    prisma.order.aggregate({
                        _sum: { total: true },
                        where: { status: { in: ['SHIPPING', 'COMPLETED'] } }
                    }),
                    prisma.order.groupBy({
                        by: ['status'],
                        _count: { id: true }
                    }),
                    prisma.order.findMany({
                        take: 5,
                        orderBy: { createdAt: 'desc' },
                        select: { id: true, customer: true, total: true, status: true, createdAt: true }
                    }),
                    prisma.product.count({ where: { isArchived: false } }),
                    prisma.product.findMany({
                        where: { stock: { gt: 0, lt: 10 }, isArchived: false },
                        take: 5,
                        select: { id: true, name: true, stock: true }
                    }),
                    prisma.product.findMany({
                        where: { stock: 0, isArchived: false },
                        take: 5,
                        select: { id: true, name: true }
                    }),
                    prisma.order.groupBy({
                        by: ['email'],
                    }).then(res => res.length)
                ]);

                apiResponse = {
                    revenue: revenueResult._sum.total || 0,
                    orders: {
                        total: totalOrders,
                        breakdown: ordersByStatus.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count.id }), {}),
                        recent: recentOrders
                    },
                    inventory: {
                        totalProducts,
                        lowStock: lowStockProducts,
                        outOfStock: outOfStockProducts
                    },
                    customers: {
                        totalUnique: customers
                    }
                };
                break;
            case 'getToolDocumentation':
                const targetTool = args?.toolName;
                // We need to re-call getTools to get the list, passing false for image gen status is fine as we just want definitions
                // Or we can assume enableImageGen from scope.
                const allTools = getTools(true);
                let docs;
                if (targetTool) {
                    docs = allTools.flatMap(t => t.functionDeclarations).find((f: any) => f.name === targetTool);
                    if (!docs) apiResponse = { error: `Tool ${targetTool} not found.` };
                    else apiResponse = { documentation: docs };
                } else {
                    docs = allTools.flatMap(t => t.functionDeclarations).map((f: any) => ({
                        name: f.name,
                        description: f.description,
                        parameters: f.parameters
                    }));
                    apiResponse = { documentation: docs };
                }
                break;
            case 'rotateLocalImage':
                const rotatedBase64 = await ImageService.rotateImage(
                    args?.base64Data as string,
                    args?.degrees as number
                );
                apiResponse = { success: true, rotatedBase64: rotatedBase64 };
                break;
            case 'generateImage':
                console.log('[Agent] Generating image with gemini-2.5-flash-image...');
                const imgModel = 'gemini-2.5-flash-image';
                let attempts = 0;
                let bestImage = null;
                let isValid = false;
                const maxAttempts = enableQC ? 3 : 1;

                const imgContents = [{
                    role: 'user',
                    parts: [{ text: args?.prompt as string }]
                }];

                if (args?.base64Image) {
                    const b64 = (args.base64Image as string).replace(/^data:image\/\w+;base64,/, "");
                    imgContents[0].parts.push({
                        inlineData: {
                            mimeType: 'image/png',
                            data: b64
                        }
                    } as any);
                }

                if (args?.imageUrl) {
                    try {
                        const fetchRes = await fetch(args.imageUrl as string, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        });
                        const arrayBuffer = await fetchRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const b64 = buffer.toString('base64');
                        const mime = fetchRes.headers.get('content-type');
                        if (mime && mime.startsWith('image/')) {
                            imgContents[0].parts.push({
                                inlineData: {
                                    mimeType: mime,
                                    data: b64
                                }
                            } as any);
                        } else {
                            console.warn('[Agent] URL returned non-image content-type:', mime);
                        }
                    } catch (err) {
                        console.error('[Agent] Failed to fetch reference image:', err);
                    }
                }

                while (attempts < maxAttempts && !isValid) {
                    attempts++;
                    console.log(`[Agent] Image Gen Attempt ${attempts}...`);

                    const imgResult = await client.models.generateContent({
                        model: imgModel,
                        contents: imgContents,
                        config: { responseModalities: ['Image'] }
                    });

                    const imgPart = imgResult.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

                    if (imgPart && imgPart.inlineData) {
                        const mimeType = imgPart.inlineData.mimeType || 'image/png';
                        const base64Data = imgPart.inlineData.data;
                        const fullBase64 = `data:${mimeType};base64,${base64Data}`;
                        bestImage = { base64: fullBase64, prompt: args?.prompt };

                        if (enableQC) {
                            console.log(`[Agent] QC Checking attempt ${attempts}...`);
                            const qcResult = await client.models.generateContent({
                                model: modelId,
                                contents: [
                                    {
                                        role: 'user',
                                        parts: [
                                            { text: `Review this generated image against the prompt: "${args?.prompt}". Does it strictly follow the description and look high quality? Answer exactly VALID or RETRY. No other text.` },
                                            { inlineData: { mimeType: 'image/png', data: base64Data } }
                                        ]
                                    }
                                ]
                            });
                            const qcText = qcResult.candidates?.[0]?.content?.parts?.[0]?.text?.toUpperCase() || "";
                            console.log(`[Agent] QC Result: ${qcText}`);
                            if (qcText.includes('VALID')) isValid = true;
                        } else {
                            isValid = true;
                        }
                    }
                }

                if (bestImage) {
                    pendingImageGeneration = bestImage;
                    apiResponse = {
                        success: true,
                        message: isValid
                            ? "Image generated and verified for quality. TELL THE USER to upload it if they want to use it."
                            : "Image generated after multiple attempts. TELL THE USER to upload it if they want to use it."
                    };
                } else {
                    apiResponse = { success: false, error: "Model failed to generate image data." };
                }
                break;
            case 'updateProductRotation':
                const pId = getSafeProductId(args?.id);
                const rot = args?.rotation as number;
                const optValId = args?.optionValueId as string;

                if (optValId) {
                    await prisma.productOptionValue.update({
                        where: { id: optValId },
                        data: { rotation: rot } as any
                    });
                } else {
                    await prisma.product.update({
                        where: { id: pId },
                        data: { imageRotation: rot } as any
                    });
                }
                apiResponse = { success: true, message: `Updated rotation to ${rot} degrees.` };
                break;
            case 'inspectProductImage':
                let targetUrl = args?.imageUrl as string;
                if (!targetUrl && args?.id) {
                    const pId = getSafeProductId(args?.id);
                    const product = await prisma.product.findUnique({ where: { id: pId } });
                    if (product?.image) targetUrl = product.image;
                }

                if (targetUrl) {
                    try {
                        const fetchRes = await fetch(targetUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        });
                        if (!fetchRes.ok) throw new Error(`Status ${fetchRes.status}`);
                        const arrayBuffer = await fetchRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const b64 = buffer.toString('base64');
                        const mime = fetchRes.headers.get('content-type');
                        if (!mime || !mime.startsWith('image/')) {
                            throw new Error(`Invalid content-type: ${mime}. Expected an image.`);
                        }

                        extraParts.push({
                            inlineData: {
                                mimeType: mime,
                                data: b64
                            }
                        });
                        apiResponse = { success: true, message: "Image fetched and presented to your vision center." };
                    } catch (e: any) {
                        apiResponse = { success: false, error: `Failed to fetch image (${targetUrl}): ${e.message}. STOP. Do not retry this URL.` };
                    }
                } else {
                    apiResponse = { success: false, error: "Product not found or has no image." };
                }
                break;
            case 'listOrders':
                const where: any = {};
                if (args?.status) where.status = args.status;
                if (args?.search) {
                    const search = args.search as string;
                    if (!isNaN(Number(search))) {
                        where.id = Number(search);
                    } else {
                        where.OR = [
                            { customer: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ];
                    }
                }
                const orderLimit = (args?.limit as number) || 20;
                const orderPage = (args?.page as number) || 1;
                const orderSkip = (orderPage - 1) * orderLimit;

                const [orderTotal, orderList] = await Promise.all([
                    prisma.order.count({ where }),
                    prisma.order.findMany({
                        where,
                        take: orderLimit,
                        skip: orderSkip,
                        orderBy: { createdAt: 'desc' },
                        include: { orderItems: true }
                    })
                ]);

                apiResponse = {
                    orders: orderList,
                    pagination: {
                        totalItems: orderTotal,
                        totalPages: Math.ceil(orderTotal / orderLimit),
                        currentPage: orderPage,
                        itemsPerPage: orderLimit
                    }
                };
                break;
            case 'updateOrderStatus':
                await prisma.order.update({
                    where: { id: args?.orderId as number },
                    data: { status: args?.status as any }
                });
                apiResponse = { success: true, message: `Order #${args?.orderId} status updated to ${args?.status}` };
                break;
            case 'cancelOrder':
                await prisma.order.update({
                    where: { id: args?.orderId as number },
                    data: { status: 'CANCELLED' }
                });
                apiResponse = { success: true, message: `Order #${args?.orderId} cancelled.` };
                break;
            case 'deleteOrder':
                if (!args?.confirm) {
                    apiResponse = { success: false, error: 'Deletion not confirmed. Please set confirm=true.' };
                } else {
                    const delOrder = await prisma.order.findUnique({ where: { id: args?.orderId as number }, select: { status: true } });
                    if (!delOrder) {
                        apiResponse = { success: false, error: 'Order not found' };
                    } else if (delOrder.status !== 'COMPLETED' && delOrder.status !== 'CANCELLED') {
                        apiResponse = { success: false, error: 'Only completed or cancelled orders can be deleted. Cancel the order first.' };
                    } else {
                        await prisma.order.delete({ where: { id: args?.orderId as number } });
                        apiResponse = { success: true, message: `Order #${args.orderId} deleted successfully.` };
                    }
                }
                break;
            case 'getOrderDetails':
                const orderInfo = await prisma.order.findUnique({
                    where: { id: args?.orderId as number },
                    include: { orderItems: { include: { product: true } } }
                });
                apiResponse = { order: orderInfo };
                break;
            case 'listCustomers':
                const userWhere: any = { role: 'CUSTOMER' };
                if (args?.search) {
                    userWhere.OR = [
                        { name: { contains: args.search as string, mode: 'insensitive' } },
                        { email: { contains: args.search as string, mode: 'insensitive' } }
                    ];
                }
                const custLimit = (args?.limit as number) || 20;
                const custPage = (args?.page as number) || 1;
                const custSkip = (custPage - 1) * custLimit;

                const [custTotal, customerList] = await Promise.all([
                    prisma.user.count({ where: userWhere }),
                    prisma.user.findMany({
                        where: userWhere,
                        take: custLimit,
                        skip: custSkip,
                        select: { id: true, name: true, email: true, phone: true, restrictedAccess: true, orders: { select: { id: true, total: true } } }
                    })
                ]);

                // Calculate total spend for "top spending" context if needed, or just return raw
                const formattedCustomers = customerList.map(c => ({
                    ...c,
                    totalOrders: c.orders.length,
                    totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0)
                }));
                apiResponse = {
                    customers: formattedCustomers,
                    pagination: {
                        totalItems: custTotal,
                        totalPages: Math.ceil(custTotal / custLimit),
                        currentPage: custPage,
                        itemsPerPage: custLimit
                    }
                };
                break;
            case 'resetCustomerPassword':
                const rUser = await prisma.user.findUnique({ where: { email: args?.email as string } });
                if (!rUser) {
                    apiResponse = { success: false, error: 'User not found' };
                } else if (!rUser.password) {
                    apiResponse = { success: false, error: 'User uses Google Sign-In' };
                } else {
                    const secret = (process.env.NEXTAUTH_SECRET || 'secret') + rUser.password;
                    const token = jwt.sign({ id: rUser.id, email: rUser.email }, secret, { expiresIn: '1h' });
                    await sendPasswordResetEmail(rUser.email, token, rUser.name || 'Customer');
                    apiResponse = { success: true, message: 'Password reset email sent.' };
                }
                break;
            case 'unlockCustomerAccount':
                await prisma.user.update({
                    where: { email: args?.email as string },
                    data: { restrictedAccess: false }
                });
                apiResponse = { success: true, message: 'Account unlocked.' };
                break;
            case 'messageCustomer':
                const sent = await sendCustomerEmail(args?.email as string, args?.subject as string, args?.message as string);
                if (sent) {
                    apiResponse = { success: true, message: 'Email sent.' };
                } else {
                    apiResponse = { success: false, error: 'Failed to send email.' };
                }
                break;
            case 'createCoupon': {
                const { code, discountType, discountValue, minOrderAmount, expiresInDays } = args;

                // Calculate expiry date
                let expiresAt = null;
                if (expiresInDays) {
                    const date = new Date();
                    date.setDate(date.getDate() + expiresInDays);
                    expiresAt = date;
                }

                const coupon = await prisma.coupon.create({
                    data: {
                        code: code.toUpperCase(),
                        type: discountType,
                        value: discountValue,
                        minOrderAmount: minOrderAmount || 0,
                        expiresAt,
                        isActive: true,
                    },
                });
                apiResponse = { success: true, coupon };
                break;
            }
            case 'getWishlistInsights': {
                const { limit = 5 } = args;

                const insights = await prisma.wishlist.groupBy({
                    by: ['productId'],
                    _count: {
                        productId: true,
                    },
                    orderBy: {
                        _count: {
                            productId: 'desc',
                        },
                    },
                    take: limit,
                });

                // Fetch product details for these IDs
                const productIds = insights.map((i: any) => i.productId);
                const products = await prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true, price: true, category: true }
                });

                // Combine
                const result = insights.map((item: any) => {
                    const product = products.find((p: any) => p.id === item.productId);
                    return {
                        product: product ? product.name : 'Unknown Product',
                        productId: item.productId,
                        wishlistCount: item._count.productId,
                        category: product ? product.category : 'N/A'
                    };
                });

                apiResponse = { success: true, insights: result };
                break;
            }
            case 'sendTargetedEmail':
                const { email, subject, message } = args;
                const emailSent = await sendCustomerEmail(email, subject, message);
                if (emailSent) {
                    apiResponse = { success: true, message: `Email sent to ${email}` };
                } else {
                    apiResponse = { success: false, error: 'Failed to send email' };
                }
                break;
            case 'listCoupons': {
                const where: any = {};
                if (args?.search) {
                    where.code = { contains: args.search.toUpperCase(), mode: 'insensitive' };
                }
                if (args?.activeOnly) {
                    where.isActive = true;
                }

                const coupLimit = (args?.limit as number) || 20;
                const coupPage = (args?.page as number) || 1;
                const coupSkip = (coupPage - 1) * coupLimit;

                const [coupTotal, coupons] = await Promise.all([
                    prisma.coupon.count({ where }),
                    prisma.coupon.findMany({
                        where,
                        take: coupLimit,
                        skip: coupSkip,
                        orderBy: { createdAt: 'desc' },
                    })
                ]);

                apiResponse = {
                    success: true,
                    coupons,
                    pagination: {
                        totalItems: coupTotal,
                        totalPages: Math.ceil(coupTotal / coupLimit),
                        currentPage: coupPage,
                        itemsPerPage: coupLimit
                    }
                };
                break;
            }
            case 'updateCoupon': {
                let coupon = null;
                if (args?.id) {
                    coupon = await prisma.coupon.findUnique({ where: { id: args.id } });
                } else if (args?.code) {
                    coupon = await prisma.coupon.findFirst({ where: { code: args.code.toUpperCase() } });
                }

                if (!coupon) {
                    apiResponse = { success: false, error: 'Coupon not found' };
                } else {
                    const updateData: any = {};
                    if (args?.discountType) updateData.type = args.discountType;
                    if (args?.discountValue !== undefined) updateData.value = args.discountValue;
                    if (args?.minOrderAmount !== undefined) updateData.minOrderAmount = args.minOrderAmount;
                    if (args?.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = args.maxDiscountAmount;
                    if (args?.usageLimit !== undefined) updateData.usageLimit = args.usageLimit;
                    if (args?.isActive !== undefined) updateData.isActive = args.isActive;
                    if (args?.expiresInDays !== undefined) {
                        const date = new Date();
                        date.setDate(date.getDate() + args.expiresInDays);
                        updateData.expiresAt = date;
                    }

                    const updated = await prisma.coupon.update({
                        where: { id: coupon.id },
                        data: updateData,
                    });
                    apiResponse = { success: true, coupon: updated };
                }
                break;
            }
            case 'deleteCoupon': {
                let coupon = null;
                if (args?.id) {
                    coupon = await prisma.coupon.findUnique({ where: { id: args.id } });
                } else if (args?.code) {
                    coupon = await prisma.coupon.findFirst({ where: { code: args.code.toUpperCase() } });
                }

                if (!coupon) {
                    apiResponse = { success: false, error: 'Coupon not found' };
                } else {
                    await prisma.coupon.delete({ where: { id: coupon.id } });
                    apiResponse = { success: true, message: `Coupon ${coupon.code} deleted successfully.` };
                }
                break;
            }
            default:
                apiResponse = {
                    error: `Tool "${name}" does not exist.`,
                    available_tools: ['listProducts', 'createProduct', 'updateProduct', 'getSiteStats', 'rotateLocalImage', 'updateProductRotation', 'listCoupons', 'updateCoupon', 'deleteCoupon'],
                    instruction: 'Please use listProducts to find items before updating them.'
                };
        }
    } catch (e: any) {
        console.warn(`[Agent] Tool ${name} failed:`, e.message);
        apiResponse = { error: e.message };
    }

    return { apiResponse, extraParts, pendingImageGeneration };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, getAuthOptions(req, res));
        if (session?.user?.role !== 'ADMIN') {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { message, history, images: base64Images, enableImageGen, enableQC, enableAutoScout, model, type, toolName, toolArgs } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: 'GEMINI_API_KEY not configured' });
        }
        const client = new GoogleGenAI({ apiKey });

        // Handle direct tool execution for Gemini Live integration
        if (type === 'execute_tool') {
            if (!toolName) {
                return res.status(400).json({ success: false, error: 'Tool name required' });
            }
            const { apiResponse, extraParts, pendingImageGeneration } = await executeToolCall(
                toolName,
                toolArgs || {},
                client,
                enableQC ?? false,
                model || 'gemini-flash-lite-latest'
            );
            return res.status(200).json({ success: true, result: apiResponse, extraParts, imageGeneration: pendingImageGeneration });
        }

        if (!message && !base64Images) {
            return res.status(400).json({ success: false, error: 'Message or image data is required' });
        }

        const tools = getTools(enableImageGen);

        // Sanitize history 
        let validHistory: any[] = [];
        if (history && Array.isArray(history)) {
            // Map legacy/simple history to new SDK Content format if needed
            // The new SDK likely expects { role: 'user'|'model', parts: [...] }
            validHistory = history.map((h: any) => ({
                role: h.role,
                parts: h.parts
            }));

            // Enforce user-starts constraint
            while (validHistory.length > 0 && validHistory[0].role !== 'user') {
                validHistory.shift();
            }
        }

        const currentParts: any[] = [];

        let textMessage = message;

        const imagesInput = req.body.images || (req.body.image ? [req.body.image] : []);

        if (imagesInput.length > 0) {
            console.log(`[Agent] Processing ${imagesInput.length} images...`);
            const uploadedUrls: string[] = [];

            for (const imgBase64 of imagesInput) {
                try {
                    // Upload image to get public URL
                    const publicUrl = await ImageService.uploadImage(imgBase64);
                    uploadedUrls.push(publicUrl);

                    const base64Data = imgBase64.split(',')[1];
                    const mimeType = imgBase64.split(';')[0].split(':')[1];

                    currentParts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    });
                } catch (err) {
                    console.error('Failed to upload/process an image:', err);
                }
            }

            if (uploadedUrls.length > 0) {
                console.log('[Agent] Uploaded user images to:', uploadedUrls);
                const urlListString = uploadedUrls.join(', ');
                textMessage = `${message}\n\n[System Note: User uploaded ${uploadedUrls.length} image(s). Available at: ${urlListString}. Use these URLs if you need to create/update products with these images.]`;
            }
        }

        currentParts.push({ text: textMessage });

        const allContents = [
            ...validHistory,
            {
                role: 'user',
                parts: [
                    {
                        text: `[MANDATORY INSTRUCTION: You MUST follow these rules strictly:
${enableAutoScout ? '1. YOUR VERY FIRST ACTION for any request involving products MUST be to call listProducts with EMPTY arguments {} to see ALL products.\n2. DO NOT use search, category, or subcategory filters on your first call. Get the full picture first.\n3. Only after seeing the full product list may you use filters for specific lookups.' : '1. Do NOT perform a full inventory scout (listProducts {}) unless specifically relevant to the user request. Use targeted search or list filters if needed.'}
${enableAutoScout ? '4.' : '2.'} Use the exact Product ID numbers returned by listProducts for any updates.
${enableAutoScout ? '5.' : '3.'} PRE-FLIGHT CHECK: If the user provides a new image, check its orientation. If it is sideways, you MUST call 'rotateLocalImage' to fix it BEFORE using it in 'createProduct'.
${enableAutoScout ? '6.' : '4.'} For EXISTING images that are sideways, use 'updateProductRotation' to fix their display.
${enableAutoScout ? '7.' : '5.'} URL SAFETY: You CANNOT invent new URLs. You must ONLY use URLs that are currently returned by listProducts, getSiteStats, or provided by the user (via image uploads). IMPORTANT: When you generate an image, it is transient (Base64). You CANNOT refrence it by URL (e.g. 'generated-image.png') until the user explicitly uploads it. Ask the user to upload it if they want to use it's URL. Do not guess links.]`
                    },
                    ...currentParts
                ]
            }
        ];

        // Select Model
        const modelId = model || "gemini-flash-lite-latest";
        let pendingImageGeneration: any = null;

        // --- DeepSeek Integration ---
        if (modelId.startsWith('deepseek-')) {
            const dsApiKey = process.env.DEEPSEEK_API_KEY;
            if (!dsApiKey) {
                return res.status(500).json({ success: false, error: 'DEEPSEEK_API_KEY not configured' });
            }

            // Convert tools to OpenAI format
            // Convert tools to OpenAI format (DeepSeek requires lowercase JSON Schema types)
            const convertSchemaToOpenAI = (schema: any): any => {
                if (!schema) return schema;
                const newSchema: any = { ...schema };

                if (newSchema.type) {
                    newSchema.type = newSchema.type.toLowerCase();
                }

                if (newSchema.properties) {
                    const newProps: any = {};
                    for (const key in newSchema.properties) {
                        newProps[key] = convertSchemaToOpenAI(newSchema.properties[key]);
                    }
                    newSchema.properties = newProps;
                }

                if (newSchema.items) {
                    newSchema.items = convertSchemaToOpenAI(newSchema.items);
                }

                return newSchema;
            };

            const dsTools = [];
            for (const toolGroup of tools) {
                for (const tool of toolGroup.functionDeclarations) {
                    if (tool.name === 'inspectProductImage') continue; // Skip vision tool
                    dsTools.push({
                        type: 'function',
                        function: {
                            name: tool.name,
                            description: tool.description,
                            parameters: convertSchemaToOpenAI(tool.parameters)
                        }
                    });
                }
            }

            const dsMessages: any[] = [];
            // System Prompt
            dsMessages.push({
                role: 'system',
                content: 'You are a helpful assistant running on DeepSeek V3. You are precise, logical, and coding-focused. You are integrating into an e-commerce agent system. You have access to tools to manage the store.'
            });

            // History
            if (validHistory) {
                validHistory.forEach(h => {
                    const textParts = h.parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
                    if (textParts.trim()) {
                        dsMessages.push({
                            role: h.role === 'model' ? 'assistant' : h.role,
                            content: textParts
                        });
                    }
                });
            }
            if (message) {
                dsMessages.push({ role: 'user', content: message });
            }

            let dsTurn = 0;
            const dsMaxTurns = 20;

            while (dsTurn < dsMaxTurns) {
                dsTurn++;
                console.log(`[DeepSeek] Turn ${dsTurn}`);

                const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dsApiKey}` },
                    body: JSON.stringify({
                        model: modelId === 'deepseek-chat' ? 'deepseek-chat' : 'deepseek-reasoner',
                        messages: dsMessages,
                        tools: dsTools,
                        stream: false
                    }),
                });

                if (!dsResponse.ok) {
                    const err = await dsResponse.json().catch(() => ({}));
                    throw new Error(err.error?.message || `DeepSeek API Error: ${dsResponse.status}`);
                }
                const dsData = await dsResponse.json();
                const choice = dsData.choices?.[0];
                const msg = choice?.message;

                if (!msg) break;

                dsMessages.push(msg); // Add assistant response to history

                if (msg.tool_calls && msg.tool_calls.length > 0) {
                    for (const toolCall of msg.tool_calls) {
                        const { name, arguments: argsStr } = toolCall.function;
                        const args = JSON.parse(argsStr);

                        const { apiResponse, pendingImageGeneration: pg } = await executeToolCall(name, args, client, enableQC, modelId);
                        if (pg) pendingImageGeneration = pg;

                        dsMessages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(apiResponse)
                        });
                    }
                } else {
                    // Final text response
                    return res.status(200).json({ success: true, text: msg.content, imageGeneration: pendingImageGeneration });
                }
            }
            return res.status(200).json({ success: true, text: "Max turns reached.", imageGeneration: pendingImageGeneration });
        }
        // --- End DeepSeek Integration ---

        // Multi-turn loop (Gemini)
        let currentContents = [...allContents];
        let turn = 0;
        const maxTurns = 30;

        while (turn < maxTurns) {
            turn++;
            console.log(`[Agent] Turn ${turn}`);

            const result: any = await client.models.generateContent({
                model: modelId,
                contents: currentContents,
                config: {
                    tools: tools as any,
                }
            });

            const candidate = result.candidates?.[0];
            const content = candidate?.content;
            const parts = content?.parts || [];

            // Add the model's response to history
            if (content) {
                currentContents.push(content);
            }

            const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

            if (functionCalls.length > 0) {
                // Execute tools
                const functionResponsesParts: any[] = [];
                // Collect any extra parts (like vision data) to add to the NEXT user turn
                const extraPartsAccumulated: any[] = [];

                for (const call of functionCalls) {
                    if (!call) continue;
                    const { name, args }: any = call;

                    const { apiResponse, extraParts, pendingImageGeneration: pg } = await executeToolCall(name, args, client, enableQC, modelId);

                    if (pg) pendingImageGeneration = pg;
                    if (extraParts) extraPartsAccumulated.push(...extraParts);

                    functionResponsesParts.push({
                        functionResponse: {
                            name: name,
                            response: apiResponse
                        }
                    });
                }

                // Gemini expects the function call response to be immediately returned in the conversation history
                currentContents.push({
                    role: 'function', // or 'tool' or part of 'user' depending on strict SDK mapping, but usually it's a separate turn or part
                    parts: functionResponsesParts
                });

                // If there were visual inspections, we might want to reinject them as "User: [Look at this]"
                if (extraPartsAccumulated.length > 0) {
                    currentContents.push({
                        role: 'user',
                        parts: [
                            { text: "System: Here is the visual data you requested." },
                            ...extraPartsAccumulated
                        ]
                    });
                }

            } else {
                const textPart = parts.find((p: any) => p.text);
                const text = textPart ? textPart.text : "Done.";
                return res.status(200).json({ success: true, text: text, imageGeneration: pendingImageGeneration });
            }
        }

        return res.status(200).json({ success: true, text: "Max conversation turns exceeded.", imageGeneration: pendingImageGeneration });

    } catch (error: any) {
        console.error('Agent Error:', error);
        return res.status(500).json({ success: false, error: 'Agent failed to process request: ' + error.message });
    }
}