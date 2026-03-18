declare module 'aos' {
    const AOS: {
        init(options?: any): void;
        refresh(): void;
        refreshHard(): void;
        on(name: string, callback: (...args: any[]) => void): void;
        off(name: string, callback: (...args: any[]) => void): void;
    };
    export default AOS;
}
