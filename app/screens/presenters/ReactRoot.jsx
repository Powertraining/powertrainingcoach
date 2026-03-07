import "/src/style.css";
import { observer } from "mobx-react-lite";
import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { AppLayout } from "./AppLayout.jsx";
import { SignUp } from "./SignUpPresenter.jsx";
import { Login } from "./LoginPresenter.jsx";
import { AppPresenter } from "./AppPresenter.jsx";
import { Subscription } from "./SubscriptionPresenter.jsx";
import { FeedBack } from "./FeedBackPresenter.jsx";
import { MyProfile } from "./MyProfilePresenter.jsx";


function makeRouter(model) {
    return createHashRouter([
        {
            path: "/",
            element: <AppLayout model={model} />,
            children: [
                {
                    path: "/signup",
                    element: model.user ? <Navigate to="/app" replace /> : <SignUp model={model} /> /* avoid someone to go to /signup page when he has been already sign up.*/
                },
                {
                    path: "/login",
                    element: model.user ? <Navigate to="/app" replace /> : <Login model={model} />
                },
                {
                    path: "/subscription",
                    element: model.isSubscribed() ? <Navigate to="/app" replace /> : <Subscription model={model} />
                },
                {
                    path: "/myProfile",
                    element: model.user ? <MyProfile model={model} /> : <Navigate to="/login" replace />
                },
                {
                    path: "/feedback",
                    element: (model.user && model.finishedWorkout === 3) ? <FeedBack model={model} /> : <Navigate to="/app" replace />
                },
                {
                    path: "/overview",
                    element: model.user ? <AppPresenter model={model} overviewMode={true} /> : <Navigate to="/login" replace />
                },
                {
                    path: "/questionnaire",
                    element: model.user ? <AppPresenter model={model} questionnaireMode={true} /> : <Navigate to="/login" replace />
                },
                {
                    path: "/app",
                    element: model.user ? <AppPresenter model={model} /> : <Navigate to="/login" replace />
                },
                { index: true, element: model.user ? <Navigate to="/app" replace /> : <Login model={model} /> }
            ]
        }
    ]);
}

const ReactRoot = observer(function ReactRoot(props) {
    return <RouterProvider router={makeRouter(props.model)} />;
});

export { ReactRoot };
