// Taken from lab
export function resolvePromise(prms, promiseState) {
    promiseState.promise = prms;
    promiseState.data = null;
    promiseState.error = null;
    if (prms) {
        prms.then(setDataACB).catch(errorACB);
    }

    function setDataACB(data) {
        if (promiseState.promise === prms) {
            promiseState.data = data;
        }
    }

    function errorACB(error) {
        promiseState.error = error;
    }
}