// public/audioProcessor.js

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.port.onmessage = (event) => {
            if (event.data.command === 'stop') {
                // This is a bit of a hack to signal the processor to stop
                // In a real app, you might handle this more gracefully
            }
        };
    }

    // Float32のサンプルをInt16に変換
    floatTo16BitPCM(input) {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const inputChannel = input[0];
            if (inputChannel) {
                const pcm16Data = this.floatTo16BitPCM(inputChannel);
                // WebSocket経由で送信するために、バイナリデータを直接転送
                this.port.postMessage(pcm16Data.buffer, [pcm16Data.buffer]);
            }
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor); 