'use client';

import { useTimer } from '../contexts/TimerContext';

const Timer: React.FC = () => {
    const { elapsedTime, formatTime, isRunning } = useTimer();

    if (!isRunning && elapsedTime === 0) {
        return null; // タイマーが開始されていない場合は表示しない
    }

    return (
        <div className="timer-display">
            <span className="timer-label">経過時間:</span>
            <span className="timer-time">{formatTime(elapsedTime)}</span>
        </div>
    );
};

export default Timer;