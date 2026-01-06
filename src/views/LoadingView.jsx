import loadingGif from '../assets/Loading.gif';
// source image: https://lottiefiles.com/free-animation/loading-animation-blue-VNMY2Tu4UQ
export default function LoadingView() {
    return (
        <div className="loading-overlay">
            <img src={loadingGif} alt="Loading..." className="loading-gif" />
        </div>
    );
}