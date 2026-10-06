import { toast } from "sonner";
import { useState } from "react";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const fn = async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, fn, setData };
};

export default useFetch;