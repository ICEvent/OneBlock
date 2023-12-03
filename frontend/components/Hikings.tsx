import React, { useEffect,useState } from "react"

import Box from '@mui/material/Box';

import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Button from "@mui/material/Button";

import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import LinkIcon from '@mui/icons-material/Link';

import { useGlobalContext,useRam } from "./Store";
import moment from "moment";

interface State {
  id: string;
  name: string;
  pfp: string;
  bio: string;
  linkname: String;
  linkurl: String;
}


const Hikings = (props) => {

  const ram = useRam();
  const { state: { isAuthed, principal } } = useGlobalContext();
  const [id, setId] = useState(props.id);
  const [hikings, setHikings] = useState([])


  useEffect(()=>{
    if(id){loadHikings()}
  },[id])

  
  function loadHikings(){
    
    
    console.log("id:",id)
    
      ram.findUserHiking(id, BigInt(moment().subtract(1,"years").unix()), BigInt(moment().unix())).then(hs =>{
        console.log("hikings: "+hs)
        setHikings(hs);
      })


  }
  return (
   
    <TableContainer component={Paper}>
    <Table sx={{ minWidth: 650 }} aria-label="simple table">
      <TableHead>
        <TableRow>
        <TableCell>Date</TableCell>
          <TableCell>Start</TableCell>
          <TableCell >End</TableCell>
          <TableCell>Distance(km)</TableCell>
          <TableCell>Hours</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
      {hikings.map((hiking) => (
            <TableRow
              key={hiking.eid}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {moment.unix(parseInt(hiking.start)).format("YYYY-MM-DD")}
              </TableCell>
              <TableCell>
                {moment.unix(parseInt(hiking.start)).format("hh:mm a")}
              </TableCell>
              <TableCell >{moment.unix(parseInt(hiking.end)).format("hh:mm a")}</TableCell>
              <TableCell >{parseInt(hiking.distance)/1000}</TableCell>
              <TableCell >{moment.unix(parseInt(hiking.end)).diff(moment.unix(parseInt(hiking.start)), 'hours')}</TableCell>
              <TableCell >
               <Link href={"https://icevent.app/event/"+parseInt(hiking.eid)} target="_blank"><LinkIcon/></Link></TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  </TableContainer>

  )
}

export { Hikings }
