export const sendDiscordNotification = async (order: any, items: any[]) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const itemsList = items
        .map((item: any) => {
            const options = item.selectedOptions 
                ? ` (${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')})` 
                : '';
            return `- ${item.quantity}x ${item.name || 'Product'}${options} (৳${item.price})`;
        })
        .join('\n');

    const embed = {
        title: "🎉 New Order Received!",
        color: 5763719, // Green
        fields: [
            { name: "Customer", value: `${order.customer || 'Guest'} (${order.phone || 'No phone'})`, inline: true },
            { name: "Total Amount", value: `৳${order.total}`, inline: true },
            { name: "Type", value: order.paymentMethod === 'MANUAL_BKASH' ? 'Manual bKash' : 'Automated', inline: true },
            { name: "Items", value: itemsList.substring(0, 1024) }, // Discord limit
            { name: "Address", value: `${order.address}, ${order.city}` }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `Order ID: ${order.id}` }
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] }),
        });
    } catch (error) {
        console.error('Discord Webhook Error:', error);
    }
};
