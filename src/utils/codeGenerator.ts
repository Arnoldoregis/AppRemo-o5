function getNextChar(c: string): string {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

function generateNextCode(latestCode: string | undefined, numberLength: number, prefixChar: string = 'A'): string {
    if (!latestCode) {
        return prefixChar + '1'.padStart(numberLength, '0');
    }

    const prefix = latestCode.charAt(0);
    const numStr = latestCode.slice(1);
    let num = parseInt(numStr, 10);
    const maxNumber = Math.pow(10, numberLength) - 1;

    if (num >= maxNumber) {
        const nextPrefix = getNextChar(prefix);
        num = 1;
        return nextPrefix + num.toString().padStart(numberLength, '0');
    } else {
        num++;
        return prefix + num.toString().padStart(numberLength, '0');
    }
}

export function generateRemovalCode(existingRemovals: { code: string }[]): string {
    const codeRegex = /^[A-Z]\d{6}$/;
    const validCodes = existingRemovals
        .map(r => r.code)
        .filter((code): code is string => !!code && codeRegex.test(code));

    const sortedCodes = validCodes.sort((a, b) => a.localeCompare(b));
    
    const latestCode = sortedCodes[sortedCodes.length - 1];
    return generateNextCode(latestCode, 6);
}

export function generatePreventiveContractCode(existingRemovals: { code: string }[]): string {
    const codeRegex = /^PRE_\d{8}$/;
    const validCodes = existingRemovals
        .map(r => r.code)
        .filter((code): code is string => !!code && codeRegex.test(code));

    if (validCodes.length === 0) {
        return 'PRE_00000001';
    }

    const latestCode = validCodes.sort().pop()!;
    const numStr = latestCode.slice(4);
    let num = parseInt(numStr, 10);
    num++;
    return 'PRE_' + num.toString().padStart(8, '0');
}


export function generateContractNumber(existingRemovals: { contractNumber?: string }[]): string {
    const contractRegex = /^[A-Z]\d{8}$/;
    const validCodes = existingRemovals
        .map(r => r.contractNumber)
        .filter((c): c is string => !!c && contractRegex.test(c));

    const sortedCodes = validCodes.sort((a, b) => a.localeCompare(b));

    const latestCode = sortedCodes[sortedCodes.length - 1];
    return generateNextCode(latestCode, 8);
}
