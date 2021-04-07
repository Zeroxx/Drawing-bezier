import React, {useRef, useEffect, useState} from 'react';
import './DrawCanvas.less';

function DrawCanvas () {
    const [drawing, setDrawing] = useState(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fillCircle = (ctx: CanvasRenderingContext2D, x:number , y: number, drawRadius: number = 2, drawColor: string = '#333') => {
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, drawRadius, 0, Math.PI * 2, false);
        ctx.fill();
    }

    const empty = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, 0, 0)
    }

    const mouseDraw = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const x = event.pageX - canvas.offsetLeft;
        const y = event.pageY - canvas.offsetTop;

        fillCircle(ctx, x, y)
    }
    
    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        setDrawing(true);
    }

    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        setDrawing(false);
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null) => {
        if (!drawing || !canvas || !ctx) return;
        mouseDraw(event, ctx, canvas);
    }

    useEffect(() => {
        if (canvasRef && canvasRef.current){ 
            const canvas = canvasRef.current;
            setCtx(canvas.getContext('2d'));
            if (!ctx) return;            
        }
        return; 
    }, [canvasRef])

    
    return (
        <div className="canvas-wrapper"> 
            <canvas 
                ref={canvasRef} id="drawCanvas" 
                onMouseDown={handleMouseDown} 
                onMouseUp={handleMouseUp} 
                onMouseMove={(event) => handleMouseMove(event, canvasRef.current, ctx)}>
            </canvas>       
        </div>
    )
}

export default DrawCanvas;