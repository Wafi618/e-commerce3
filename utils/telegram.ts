export const sendTelegramNotification = async (order: any, items: any[]) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    const itemsList = items
        .map((item: any) => {
            const options = item.selectedOptions 
                ? ` (${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')})` 
                : '';
            return `- ${item.quantity}x ${item.name || 'Product'}${options} (৳${item.price})`;
        })
        .join('\n');

    const message = `
🎉 *New Order Received!*

*Customer:* ${order.customer || 'Guest'} (${order.phone || 'No phone'})
*Total Amount:* ৳${order.total}
*Type:* ${order.paymentMethod === 'MANUAL_BKASH' ? 'Manual bKash' : 'Automated'}
*Address:* ${order.address}, ${order.city}

*Items:*
${itemsList}

*Order ID:* ${order.id}
    `.trim();

    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            }),
        });
    } catch (error) {
        console.error('Telegram Notification Error:', error);
    }
};