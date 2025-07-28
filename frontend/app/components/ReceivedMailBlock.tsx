'use client';

interface ReceivedMailBlockProps {
    receivedMail: string;
}

const ReceivedMailBlock: React.FC<ReceivedMailBlockProps> = ({ receivedMail }) => {
    // Remove the | prefix from each line
    const cleanText = receivedMail
        .split('\n')
        .map(line => line.replace(/^\| /, ''))
        .join('\n');

    return (
        <div className="received-mail-block">
            <pre className="received-mail-text">{cleanText}</pre>
        </div>
    );
};

export default ReceivedMailBlock;