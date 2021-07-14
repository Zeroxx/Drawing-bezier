import { Coordinates } from 'lazy-brush';

export const findCanvasPosition = (object: HTMLCanvasElement | null) => {
    if (!object) return;
    let curLeft = 0;
    let curTop = 0;
    if (object.offsetParent) {
        do {
            curLeft += object.offsetLeft;
            curTop += object.offsetTop;
        } while (object === object.offsetParent);
    return {x: curLeft - document.body.scrollLeft, y: curTop - document.body.scrollTop}
    }
}

export const middleCoordinatePoint = (point1: Coordinates, point2: Coordinates) => {
    return {
        x: point1.x + (point2.x - point1.x) / 2,
        y: point1.y + (point2.y - point1.y) / 2
    };
}

export function copyTouch(touch: React.Touch) {
    return {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
}

export const getPositions = (offsetX: number, offsetY: number, clientX: number, clientY: number): {x: number, y: number} => {
    return {x: clientX - offsetX, y: clientY - offsetY}
}

export const resizeCanvasToDisplay = (canvas: HTMLCanvasElement): void => {
    const { width, height } = canvas.getBoundingClientRect()
    console.log('boundingclient: ', width, height);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width
            canvas.height = height
        }
    return;
}

export const getCanvasHeight = (canvas: HTMLCanvasElement): number => {
    const { height } = canvas.getBoundingClientRect()
    return height;
}

export const getCanvasWidth = (canvas: HTMLCanvasElement): number => {
    const { width } = canvas.getBoundingClientRect()
    return width;
}
