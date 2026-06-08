const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const toSubscript = (n: number) => n.toString().split('').map(d => subscripts[parseInt(d)]).join('');

export const formatNumber = (num: number, digits: number = 2): string => {
    if (num === 0) return '0';
    
    if (Math.abs(num) >= 1000) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "B" },
            { value: 1e12, symbol: "T" }
        ];
        const item = lookup.slice().reverse().find(function(item) {
            return Math.abs(num) >= item.value;
        });
        if (item) {
            return (num / item.value).toFixed(digits).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + item.symbol;
        }
    }

    if (Math.abs(num) < 0.00001) {
        const str = Math.abs(num).toFixed(30).replace(/\.?0+$/, "");
        if (str === "0") return "0";
        const match = str.match(/^0\.0{5,}/);
        if (match) {
            const zeroCount = match[0].length - 2;
            const rest = str.slice(match[0].length).slice(0, 4);
            return `${num < 0 ? '-' : ''}0.0${toSubscript(zeroCount)}${rest}`;
        }
    }

    const precision = Math.abs(num) < 1 ? 8 : digits;
    return num.toFixed(precision).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1");
};

export const formatPrice = (price: number): string => {
    if (!price && price !== 0) return '0';
    if (price === 0) return '0';
    
    if (Math.abs(price) < 0.00001) {
        const str = Math.abs(price).toFixed(30).replace(/\.?0+$/, "");
        if (str === "0") return "0";
        const match = str.match(/^0\.0{5,}/);
        if (match) {
            const zeroCount = match[0].length - 2;
            const rest = str.slice(match[0].length).slice(0, 4);
            return `${price < 0 ? '-' : ''}0.0${toSubscript(zeroCount)}${rest}`;
        }
    }
    
    const precision = Math.abs(price) < 0.01 ? 8 : 2;
    return price.toFixed(precision).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1");
};
