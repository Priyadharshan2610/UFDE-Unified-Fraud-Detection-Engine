import { useEffect, useState } from "react";
import "../App.css";

import Transactions from "./Transactions";


function Processing({
  role,
  onLogout,
}) {

  const [complete, setComplete] =
    useState(false);


  useEffect(() => {

    const timer =
      setTimeout(() => {

        setComplete(true);

      }, 3000);


    return () =>
      clearTimeout(timer);

  }, []);


  // =====================================================
  // ANALYSIS COMPLETE
  // =====================================================

  if (complete) {

    return (

      <Transactions
        role={role}
        onLogout={onLogout}
      />

    );

  }


  // =====================================================
  // PROCESSING SCREEN
  // =====================================================

  return (

    <div className="processing-page">

      <div className="processing-card">


        <div className="processing-spinner">
        </div>


        <h1>
          Analyzing Transaction Data
        </h1>


        <p className="processing-subtitle">
          Please wait while UFDE processes
          your files.
        </p>


        <div className="processing-steps">


          <div className="processing-step completed">

            <span>
              ✓
            </span>

            <p>
              Files uploaded
            </p>

          </div>


          <div className="processing-step completed">

            <span>
              ✓
            </span>

            <p>
              Validating files
            </p>

          </div>


          <div className="processing-step active">

            <span>
              ●
            </span>

            <p>
              Running fraud detection engines
            </p>

          </div>


          <div className="processing-step">

            <span>
              ○
            </span>

            <p>
              Calculating unified risk
            </p>

          </div>


          <div className="processing-step">

            <span>
              ○
            </span>

            <p>
              Preparing results
            </p>

          </div>


        </div>

      </div>

    </div>

  );
}


export default Processing;