"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../lib/api";
export type Favorite={id?:string;propertyId:string;title?:string;property?:{title?:string}};

const KEY=["favorites"];

export function useFavorites(){
  return useQuery<Favorite[]>({
    queryKey:KEY,
    queryFn:()=>authApi<Favorite[]>("/favorites"),
    staleTime:60_000,
    gcTime:10*60_000,
  });
}

export function useSaveFavorite(){
  const qc=useQueryClient();
  return useMutation({
    mutationFn:async(propertyId:string)=>{
      const existing=qc.getQueryData<Favorite[]>(KEY)??[];
      const found=existing.find(x=>String(x.propertyId)===String(propertyId));
      return found
        ? authApi("/favorites/"+propertyId,{method:"DELETE"})
        : authApi("/favorites/"+propertyId,{method:"POST"});
    },
    onMutate:async(propertyId)=>{
      await qc.cancelQueries({queryKey:KEY});
      const previous=qc.getQueryData<Favorite[]>(KEY)??[];
      const exists=previous.some(x=>String(x.propertyId)===String(propertyId));
      qc.setQueryData<Favorite[]>(KEY,exists
        ? previous.filter(x=>String(x.propertyId)!==String(propertyId))
        : [...previous,{propertyId}]);
      return {previous};
    },
    onError:(_err,_propertyId,ctx)=>{
      if(ctx?.previous)qc.setQueryData(KEY,ctx.previous);
    },
    onSettled:()=>qc.invalidateQueries({queryKey:KEY}),
  });
}
