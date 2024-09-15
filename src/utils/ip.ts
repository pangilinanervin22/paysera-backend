import exp from 'constants';
import os from 'os';

function getLocalIPWireless(): string | undefined {
    try {
        const networkInterfaces = os.networkInterfaces();
        let serverIp = '';

        console.log(networkInterfaces);

        for (const net of networkInterfaces['Wi-Fi']!) {
            if (net.family === 'IPv4' && !net.internal) {
                serverIp = net.address;
                break;
            }
        }
        return serverIp;
    } catch (error) {
        return "localhost";
    }
}

export default getLocalIPWireless;