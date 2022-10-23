
const BS = (list, el, compareFn) => {
    let m = 0;
    let n = list.length - 1;
    while (m <= n) {
        let k = (n + m) >> 1;
        let cmp = compareFn(el, k);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else if (cmp === 0) {
            return k;
        }
    }
    return -m - 1;
}

module.exports = {
    BS
}